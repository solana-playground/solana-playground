// Copyright 2015 The Rust Project Developers. See the COPYRIGHT
// file at the top-level directory of this distribution and at
// http://rust-lang.org/COPYRIGHT.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

use std::borrow::Cow;

use syntax::source_map::{BytePos, Pos, Span};

use comment::{rewrite_comment, CodeCharKind, CommentCodeSlices};
use config::{EmitMode, FileName};
use shape::{Indent, Shape};
use source_map::LineRangeUtils;
use utils::{count_newlines, last_line_width, mk_sp};
use visitor::FmtVisitor;

struct SnippetStatus {
    /// An offset to the current line from the beginning of the original snippet.
    line_start: usize,
    /// A length of trailing whitespaces on the current line.
    last_wspace: Option<usize>,
    /// The current line number.
    cur_line: usize,
}

impl SnippetStatus {
    fn new(cur_line: usize) -> Self {
        SnippetStatus {
            line_start: 0,
            last_wspace: None,
            cur_line,
        }
    }
}

impl<'a> FmtVisitor<'a> {
    fn output_at_start(&self) -> bool {
        self.buffer.is_empty()
    }

    pub fn format_missing(&mut self, end: BytePos) {
        // HACK(topecongiro)
        // We use `format_missing()` to extract a missing comment between a macro
        // (or alike) and a trailing semicolon. Here we just try to avoid calling
        // `format_missing_inner` in the common case where there is no such comment.
        // This is a hack, ideally we should fix a possible bug in `format_missing_inner`
        // or refactor `visit_mac` and `rewrite_macro`, but this should suffice to fix the
        // issue (#2727).
        let missing_snippet = self.snippet(mk_sp(self.last_pos, end));
        if missing_snippet.trim() == ";" {
            self.push_str(";");
            self.last_pos = end;
            return;
        }
        self.format_missing_inner(end, |this, last_snippet, _| this.push_str(last_snippet))
    }

    pub fn format_missing_with_indent(&mut self, end: BytePos) {
        let config = self.config;
        self.format_missing_inner(end, |this, last_snippet, snippet| {
            this.push_str(last_snippet.trim_right());
            if last_snippet == snippet && !this.output_at_start() {
                // No new lines in the snippet.
                this.push_str("\n");
            }
            let indent = this.block_indent.to_string(config);
            this.push_str(&indent);
        })
    }

    pub fn format_missing_no_indent(&mut self, end: BytePos) {
        self.format_missing_inner(end, |this, last_snippet, _| {
            this.push_str(last_snippet.trim_right());
        })
    }

    fn format_missing_inner<F: Fn(&mut FmtVisitor, &str, &str)>(
        &mut self,
        end: BytePos,
        process_last_snippet: F,
    ) {
        let start = self.last_pos;

        if start == end {
            // Do nothing if this is the beginning of the file.
            if !self.output_at_start() {
                process_last_snippet(self, "", "");
            }
            return;
        }

        assert!(
            start < end,
            "Request to format inverted span: {:?} to {:?}",
            self.source_map.lookup_char_pos(start),
            self.source_map.lookup_char_pos(end)
        );

        self.last_pos = end;
        let span = mk_sp(start, end);
        let snippet = self.snippet(span);

        // Do nothing for spaces in the beginning of the file
        if start == BytePos(0) && end.0 as usize == snippet.len() && snippet.trim().is_empty() {
            return;
        }

        if snippet.trim().is_empty() && !out_of_file_lines_range!(self, span) {
            // Keep vertical spaces within range.
            self.push_vertical_spaces(count_newlines(snippet));
            process_last_snippet(self, "", snippet);
        } else {
            self.write_snippet(span, &process_last_snippet);
        }
    }

    fn push_vertical_spaces(&mut self, mut newline_count: usize) {
        let offset = self.count_trailing_newlines();
        let newline_upper_bound = self.config.blank_lines_upper_bound() + 1;
        let newline_lower_bound = self.config.blank_lines_lower_bound() + 1;

        if newline_count + offset > newline_upper_bound {
            if offset >= newline_upper_bound {
                newline_count = 0;
            } else {
                newline_count = newline_upper_bound - offset;
            }
        } else if newline_count + offset < newline_lower_bound {
            if offset >= newline_lower_bound {
                newline_count = 0;
            } else {
                newline_count = newline_lower_bound - offset;
            }
        }

        let blank_lines = "\n".repeat(newline_count);
        self.push_str(&blank_lines);
    }

    fn count_trailing_newlines(&self) -> usize {
        let mut buf = &*self.buffer;
        let mut result = 0;
        while buf.ends_with('\n') {
            buf = &buf[..buf.len() - 1];
            result += 1;
        }
        result
    }

    fn write_snippet<F>(&mut self, span: Span, process_last_snippet: F)
    where
        F: Fn(&mut FmtVisitor, &str, &str),
    {
        // Get a snippet from the file start to the span's hi without allocating.
        // We need it to determine what precedes the current comment. If the comment
        // follows code on the same line, we won't touch it.
        let big_span_lo = self.source_map.lookup_char_pos(span.lo()).file.start_pos;
        let local_begin = self.source_map.lookup_byte_offset(big_span_lo);
        let local_end = self.source_map.lookup_byte_offset(span.hi());
        let start_index = local_begin.pos.to_usize();
        let end_index = local_end.pos.to_usize();
        let big_snippet = &local_begin.fm.src.as_ref().unwrap()[start_index..end_index];

        let big_diff = (span.lo() - big_span_lo).to_usize();
        let snippet = self.snippet(span);

        debug!("write_snippet `{}`", snippet);

        self.write_snippet_inner(big_snippet, big_diff, snippet, span, process_last_snippet);
    }

    fn write_snippet_inner<F>(
        &mut self,
        big_snippet: &str,
        big_diff: usize,
        old_snippet: &str,
        span: Span,
        process_last_snippet: F,
    ) where
        F: Fn(&mut FmtVisitor, &str, &str),
    {
        // Trim whitespace from the right hand side of each line.
        // Annoyingly, the library functions for splitting by lines etc. are not
        // quite right, so we must do it ourselves.
        let char_pos = self.source_map.lookup_char_pos(span.lo());
        let file_name = &char_pos.file.name.clone().into();
        let mut status = SnippetStatus::new(char_pos.line);

        let snippet = &*match self.config.emit_mode() {
            EmitMode::Coverage => Cow::from(replace_chars(old_snippet)),
            _ => Cow::from(old_snippet),
        };

        for (kind, offset, subslice) in CommentCodeSlices::new(snippet) {
            debug!("{:?}: {:?}", kind, subslice);

            let newline_count = count_newlines(subslice);
            let within_file_lines_range = self.config.file_lines().contains_range(
                file_name,
                status.cur_line,
                status.cur_line + newline_count,
            );

            if CodeCharKind::Comment == kind && within_file_lines_range {
                // 1: comment.
                self.process_comment(
                    &mut status,
                    snippet,
                    &big_snippet[..(offset + big_diff)],
                    offset,
                    subslice,
                );
            } else if subslice.trim().is_empty() && newline_count > 0 && within_file_lines_range {
                // 2: blank lines.
                self.push_vertical_spaces(newline_count);
                status.cur_line += newline_count;
                status.line_start = offset + newline_count;
            } else {
                // 3: code which we failed to format or which is not within file-lines range.
                self.process_missing_code(&mut status, snippet, subslice, offset, file_name);
            }
        }

        process_last_snippet(self, &snippet[status.line_start..], snippet);
    }

    fn process_comment(
        &mut self,
        status: &mut SnippetStatus,
        snippet: &str,
        big_snippet: &str,
        offset: usize,
        subslice: &str,
    ) {
        let last_char = big_snippet
            .chars()
            .rev()
            .skip_while(|rev_c| [' ', '\t'].contains(rev_c))
            .next();

        let fix_indent = last_char.map_or(true, |rev_c| ['{', '\n'].contains(&rev_c));

        let comment_indent = if fix_indent {
            if let Some('{') = last_char {
                self.push_str("\n");
            }
            let indent_str = self.block_indent.to_string(self.config);
            self.push_str(&indent_str);
            self.block_indent
        } else {
            self.push_str(" ");
            Indent::from_width(self.config, last_line_width(&self.buffer))
        };

        let comment_width = ::std::cmp::min(
            self.config.comment_width(),
            self.config.max_width() - self.block_indent.width(),
        );
        let comment_shape = Shape::legacy(comment_width, comment_indent);
        let comment_str = rewrite_comment(subslice, false, comment_shape, self.config)
            .unwrap_or_else(|| String::from(subslice));
        self.push_str(&comment_str);

        status.last_wspace = None;
        status.line_start = offset + subslice.len();

        if let Some('/') = subslice.chars().nth(1) {
            // check that there are no contained block comments
            if !subslice
                .split('\n')
                .map(|s| s.trim_left())
                .any(|s| s.len() >= 2 && &s[0..2] == "/*")
            {
                // Add a newline after line comments
                self.push_str("\n");
            }
        } else if status.line_start <= snippet.len() {
            // For other comments add a newline if there isn't one at the end already
            match snippet[status.line_start..].chars().next() {
                Some('\n') | Some('\r') => (),
                _ => self.push_str("\n"),
            }
        }

        status.cur_line += count_newlines(subslice);
    }

    fn process_missing_code(
        &mut self,
        status: &mut SnippetStatus,
        snippet: &str,
        subslice: &str,
        offset: usize,
        file_name: &FileName,
    ) {
        for (mut i, c) in subslice.char_indices() {
            i += offset;

            if c == '\n' {
                let skip_this_line = !self
                    .config
                    .file_lines()
                    .contains_line(file_name, status.cur_line);
                if skip_this_line {
                    status.last_wspace = None;
                }

                if let Some(lw) = status.last_wspace {
                    self.push_str(&snippet[status.line_start..lw]);
                    self.push_str("\n");
                    status.last_wspace = None;
                } else {
                    self.push_str(&snippet[status.line_start..i + 1]);
                }

                status.cur_line += 1;
                status.line_start = i + 1;
            } else if c.is_whitespace() && status.last_wspace.is_none() {
                status.last_wspace = Some(i);
            } else if c == ';' && status.last_wspace.is_some() {
                status.line_start = i;
                status.last_wspace = None;
            } else {
                status.last_wspace = None;
            }
        }

        let remaining = snippet[status.line_start..subslice.len() + offset].trim();
        if !remaining.is_empty() {
            self.push_str(remaining);
            status.line_start = subslice.len() + offset;
        }
    }
}

fn replace_chars(string: &str) -> String {
    string
        .chars()
        .map(|ch| if ch.is_whitespace() { ch } else { 'X' })
        .collect()
}
