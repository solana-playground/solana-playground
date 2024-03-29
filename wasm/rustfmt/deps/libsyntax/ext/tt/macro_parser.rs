// Copyright 2012-2017 The Rust Project Developers. See the COPYRIGHT
// file at the top-level directory of this distribution and at
// http://rust-lang.org/COPYRIGHT.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

//! This is an NFA-based parser, which calls out to the main rust parser for named nonterminals
//! (which it commits to fully when it hits one in a grammar). There's a set of current NFA threads
//! and a set of next ones. Instead of NTs, we have a special case for Kleene star. The big-O, in
//! pathological cases, is worse than traditional use of NFA or Earley parsing, but it's an easier
//! fit for Macro-by-Example-style rules.
//!
//! (In order to prevent the pathological case, we'd need to lazily construct the resulting
//! `NamedMatch`es at the very end. It'd be a pain, and require more memory to keep around old
//! items, but it would also save overhead)
//!
//! We don't say this parser uses the Earley algorithm, because it's unnecessarily inaccurate.
//! The macro parser restricts itself to the features of finite state automata. Earley parsers
//! can be described as an extension of NFAs with completion rules, prediction rules, and recursion.
//!
//! Quick intro to how the parser works:
//!
//! A 'position' is a dot in the middle of a matcher, usually represented as a
//! dot. For example `· a $( a )* a b` is a position, as is `a $( · a )* a b`.
//!
//! The parser walks through the input a character at a time, maintaining a list
//! of threads consistent with the current position in the input string: `cur_items`.
//!
//! As it processes them, it fills up `eof_items` with threads that would be valid if
//! the macro invocation is now over, `bb_items` with threads that are waiting on
//! a Rust nonterminal like `$e:expr`, and `next_items` with threads that are waiting
//! on a particular token. Most of the logic concerns moving the · through the
//! repetitions indicated by Kleene stars. The rules for moving the · without
//! consuming any input are called epsilon transitions. It only advances or calls
//! out to the real Rust parser when no `cur_items` threads remain.
//!
//! Example:
//!
//! ```text, ignore
//! Start parsing a a a a b against [· a $( a )* a b].
//!
//! Remaining input: a a a a b
//! next: [· a $( a )* a b]
//!
//! - - - Advance over an a. - - -
//!
//! Remaining input: a a a b
//! cur: [a · $( a )* a b]
//! Descend/Skip (first item).
//! next: [a $( · a )* a b]  [a $( a )* · a b].
//!
//! - - - Advance over an a. - - -
//!
//! Remaining input: a a b
//! cur: [a $( a · )* a b]  [a $( a )* a · b]
//! Follow epsilon transition: Finish/Repeat (first item)
//! next: [a $( a )* · a b]  [a $( · a )* a b]  [a $( a )* a · b]
//!
//! - - - Advance over an a. - - - (this looks exactly like the last step)
//!
//! Remaining input: a b
//! cur: [a $( a · )* a b]  [a $( a )* a · b]
//! Follow epsilon transition: Finish/Repeat (first item)
//! next: [a $( a )* · a b]  [a $( · a )* a b]  [a $( a )* a · b]
//!
//! - - - Advance over an a. - - - (this looks exactly like the last step)
//!
//! Remaining input: b
//! cur: [a $( a · )* a b]  [a $( a )* a · b]
//! Follow epsilon transition: Finish/Repeat (first item)
//! next: [a $( a )* · a b]  [a $( · a )* a b]  [a $( a )* a · b]
//!
//! - - - Advance over a b. - - -
//!
//! Remaining input: ''
//! eof: [a $( a )* a b ·]
//! ```

pub use self::NamedMatch::*;
pub use self::ParseResult::*;
use self::TokenTreeOrTokenTreeSlice::*;

use ast::Ident;
use syntax_pos::{self, BytePos, Span};
use errors::FatalError;
use ext::tt::quoted::{self, TokenTree};
use parse::{Directory, ParseSess};
use parse::parser::{Parser, PathStyle};
use parse::token::{self, DocComment, Nonterminal, Token};
use print::pprust;
use OneVector;
use symbol::keywords;
use tokenstream::TokenStream;

use std::mem;
use std::ops::{Deref, DerefMut};
use std::rc::Rc;
use std::collections::HashMap;
use std::collections::hash_map::Entry::{Occupied, Vacant};

// To avoid costly uniqueness checks, we require that `MatchSeq` always has a nonempty body.

/// Either a sequence of token trees or a single one. This is used as the representation of the
/// sequence of tokens that make up a matcher.
#[derive(Clone)]
enum TokenTreeOrTokenTreeSlice<'a> {
    Tt(TokenTree),
    TtSeq(&'a [TokenTree]),
}

impl<'a> TokenTreeOrTokenTreeSlice<'a> {
    /// Returns the number of constituent top-level token trees of `self` (top-level in that it
    /// will not recursively descend into subtrees).
    fn len(&self) -> usize {
        match *self {
            TtSeq(ref v) => v.len(),
            Tt(ref tt) => tt.len(),
        }
    }

    /// The `index`-th token tree of `self`.
    fn get_tt(&self, index: usize) -> TokenTree {
        match *self {
            TtSeq(ref v) => v[index].clone(),
            Tt(ref tt) => tt.get_tt(index),
        }
    }
}

/// An unzipping of `TokenTree`s... see the `stack` field of `MatcherPos`.
///
/// This is used by `inner_parse_loop` to keep track of delimited submatchers that we have
/// descended into.
#[derive(Clone)]
struct MatcherTtFrame<'a> {
    /// The "parent" matcher that we are descending into.
    elts: TokenTreeOrTokenTreeSlice<'a>,
    /// The position of the "dot" in `elts` at the time we descended.
    idx: usize,
}

/// Represents a single "position" (aka "matcher position", aka "item"), as described in the module
/// documentation.
#[derive(Clone)]
struct MatcherPos<'a> {
    /// The token or sequence of tokens that make up the matcher
    top_elts: TokenTreeOrTokenTreeSlice<'a>,
    /// The position of the "dot" in this matcher
    idx: usize,
    /// The beginning position in the source that the beginning of this matcher corresponds to. In
    /// other words, the token in the source at `sp_lo` is matched against the first token of the
    /// matcher.
    sp_lo: BytePos,

    /// For each named metavar in the matcher, we keep track of token trees matched against the
    /// metavar by the black box parser. In particular, there may be more than one match per
    /// metavar if we are in a repetition (each repetition matches each of the variables).
    /// Moreover, matchers and repetitions can be nested; the `matches` field is shared (hence the
    /// `Rc`) among all "nested" matchers. `match_lo`, `match_cur`, and `match_hi` keep track of
    /// the current position of the `self` matcher position in the shared `matches` list.
    ///
    /// Also, note that while we are descending into a sequence, matchers are given their own
    /// `matches` vector. Only once we reach the end of a full repetition of the sequence do we add
    /// all bound matches from the submatcher into the shared top-level `matches` vector. If `sep`
    /// and `up` are `Some`, then `matches` is _not_ the shared top-level list. Instead, if one
    /// wants the shared `matches`, one should use `up.matches`.
    matches: Vec<Rc<Vec<NamedMatch>>>,
    /// The position in `matches` corresponding to the first metavar in this matcher's sequence of
    /// token trees. In other words, the first metavar in the first token of `top_elts` corresponds
    /// to `matches[match_lo]`.
    match_lo: usize,
    /// The position in `matches` corresponding to the metavar we are currently trying to match
    /// against the source token stream. `match_lo <= match_cur <= match_hi`.
    match_cur: usize,
    /// Similar to `match_lo` except `match_hi` is the position in `matches` of the _last_ metavar
    /// in this matcher.
    match_hi: usize,

    // Specifically used if we are matching a repetition. If we aren't both should be `None`.
    /// The KleeneOp of this sequence if we are in a repetition.
    seq_op: Option<quoted::KleeneOp>,
    /// The separator if we are in a repetition
    sep: Option<Token>,
    /// The "parent" matcher position if we are in a repetition. That is, the matcher position just
    /// before we enter the sequence.
    up: Option<MatcherPosHandle<'a>>,

    // Specifically used to "unzip" token trees. By "unzip", we mean to unwrap the delimiters from
    // a delimited token tree (e.g. something wrapped in `(` `)`) or to get the contents of a doc
    // comment...
    /// When matching against matchers with nested delimited submatchers (e.g. `pat ( pat ( .. )
    /// pat ) pat`), we need to keep track of the matchers we are descending into. This stack does
    /// that where the bottom of the stack is the outermost matcher.
    // Also, throughout the comments, this "descent" is often referred to as "unzipping"...
    stack: Vec<MatcherTtFrame<'a>>,
}

impl<'a> MatcherPos<'a> {
    /// Add `m` as a named match for the `idx`-th metavar.
    fn push_match(&mut self, idx: usize, m: NamedMatch) {
        let matches = Rc::make_mut(&mut self.matches[idx]);
        matches.push(m);
    }
}

// Lots of MatcherPos instances are created at runtime. Allocating them on the
// heap is slow. Furthermore, using SmallVec<MatcherPos> to allocate them all
// on the stack is also slow, because MatcherPos is quite a large type and
// instances get moved around a lot between vectors, which requires lots of
// slow memcpy calls.
//
// Therefore, the initial MatcherPos is always allocated on the stack,
// subsequent ones (of which there aren't that many) are allocated on the heap,
// and this type is used to encapsulate both cases.
enum MatcherPosHandle<'a> {
    Ref(&'a mut MatcherPos<'a>),
    Box(Box<MatcherPos<'a>>),
}

impl<'a> Clone for MatcherPosHandle<'a> {
    // This always produces a new Box.
    fn clone(&self) -> Self {
        MatcherPosHandle::Box(match *self {
            MatcherPosHandle::Ref(ref r) => Box::new((**r).clone()),
            MatcherPosHandle::Box(ref b) => b.clone(),
        })
    }
}

impl<'a> Deref for MatcherPosHandle<'a> {
    type Target = MatcherPos<'a>;
    fn deref(&self) -> &Self::Target {
        match *self {
            MatcherPosHandle::Ref(ref r) => r,
            MatcherPosHandle::Box(ref b) => b,
        }
    }
}

impl<'a> DerefMut for MatcherPosHandle<'a> {
    fn deref_mut(&mut self) -> &mut MatcherPos<'a> {
        match *self {
            MatcherPosHandle::Ref(ref mut r) => r,
            MatcherPosHandle::Box(ref mut b) => b,
        }
    }
}

/// Represents the possible results of an attempted parse.
pub enum ParseResult<T> {
    /// Parsed successfully.
    Success(T),
    /// Arm failed to match. If the second parameter is `token::Eof`, it indicates an unexpected
    /// end of macro invocation. Otherwise, it indicates that no rules expected the given token.
    Failure(syntax_pos::Span, Token),
    /// Fatal error (malformed macro?). Abort compilation.
    Error(syntax_pos::Span, String),
}

/// A `ParseResult` where the `Success` variant contains a mapping of `Ident`s to `NamedMatch`es.
/// This represents the mapping of metavars to the token trees they bind to.
pub type NamedParseResult = ParseResult<HashMap<Ident, Rc<NamedMatch>>>;

/// Count how many metavars are named in the given matcher `ms`.
pub fn count_names(ms: &[TokenTree]) -> usize {
    ms.iter().fold(0, |count, elt| {
        count + match *elt {
            TokenTree::Sequence(_, ref seq) => seq.num_captures,
            TokenTree::Delimited(_, ref delim) => count_names(&delim.tts),
            TokenTree::MetaVar(..) => 0,
            TokenTree::MetaVarDecl(..) => 1,
            TokenTree::Token(..) => 0,
        }
    })
}

/// Initialize `len` empty shared `Vec`s to be used to store matches of metavars.
fn create_matches(len: usize) -> Vec<Rc<Vec<NamedMatch>>> {
    (0..len).into_iter().map(|_| Rc::new(Vec::new())).collect()
}

/// Generate the top-level matcher position in which the "dot" is before the first token of the
/// matcher `ms` and we are going to start matching at position `lo` in the source.
fn initial_matcher_pos(ms: &[TokenTree], lo: BytePos) -> MatcherPos {
    let match_idx_hi = count_names(ms);
    let matches = create_matches(match_idx_hi);
    MatcherPos {
        // Start with the top level matcher given to us
        top_elts: TtSeq(ms), // "elts" is an abbr. for "elements"
        // The "dot" is before the first token of the matcher
        idx: 0,
        // We start matching with byte `lo` in the source code
        sp_lo: lo,

        // Initialize `matches` to a bunch of empty `Vec`s -- one for each metavar in `top_elts`.
        // `match_lo` for `top_elts` is 0 and `match_hi` is `matches.len()`. `match_cur` is 0 since
        // we haven't actually matched anything yet.
        matches,
        match_lo: 0,
        match_cur: 0,
        match_hi: match_idx_hi,

        // Haven't descended into any delimiters, so empty stack
        stack: vec![],

        // Haven't descended into any sequences, so both of these are `None`.
        seq_op: None,
        sep: None,
        up: None,
    }
}

/// `NamedMatch` is a pattern-match result for a single `token::MATCH_NONTERMINAL`:
/// so it is associated with a single ident in a parse, and all
/// `MatchedNonterminal`s in the `NamedMatch` have the same nonterminal type
/// (expr, item, etc). Each leaf in a single `NamedMatch` corresponds to a
/// single `token::MATCH_NONTERMINAL` in the `TokenTree` that produced it.
///
/// The in-memory structure of a particular `NamedMatch` represents the match
/// that occurred when a particular subset of a matcher was applied to a
/// particular token tree.
///
/// The width of each `MatchedSeq` in the `NamedMatch`, and the identity of
/// the `MatchedNonterminal`s, will depend on the token tree it was applied
/// to: each `MatchedSeq` corresponds to a single `TTSeq` in the originating
/// token tree. The depth of the `NamedMatch` structure will therefore depend
/// only on the nesting depth of `ast::TTSeq`s in the originating
/// token tree it was derived from.
#[derive(Debug, Clone)]
pub enum NamedMatch {
    MatchedSeq(Rc<Vec<NamedMatch>>, syntax_pos::Span),
    MatchedNonterminal(Rc<Nonterminal>),
}

/// Takes a sequence of token trees `ms` representing a matcher which successfully matched input
/// and an iterator of items that matched input and produces a `NamedParseResult`.
fn nameize<I: Iterator<Item = NamedMatch>>(
    sess: &ParseSess,
    ms: &[TokenTree],
    mut res: I,
) -> NamedParseResult {
    // Recursively descend into each type of matcher (e.g. sequences, delimited, metavars) and make
    // sure that each metavar has _exactly one_ binding. If a metavar does not have exactly one
    // binding, then there is an error. If it does, then we insert the binding into the
    // `NamedParseResult`.
    fn n_rec<I: Iterator<Item = NamedMatch>>(
        sess: &ParseSess,
        m: &TokenTree,
        res: &mut I,
        ret_val: &mut HashMap<Ident, Rc<NamedMatch>>,
    ) -> Result<(), (syntax_pos::Span, String)> {
        match *m {
            TokenTree::Sequence(_, ref seq) => for next_m in &seq.tts {
                n_rec(sess, next_m, res.by_ref(), ret_val)?
            },
            TokenTree::Delimited(_, ref delim) => for next_m in &delim.tts {
                n_rec(sess, next_m, res.by_ref(), ret_val)?;
            },
            TokenTree::MetaVarDecl(span, _, id) if id.name == keywords::Invalid.name() => {
                if sess.missing_fragment_specifiers.borrow_mut().remove(&span) {
                    return Err((span, "missing fragment specifier".to_string()));
                }
            }
            TokenTree::MetaVarDecl(sp, bind_name, _) => {
                match ret_val.entry(bind_name) {
                    Vacant(spot) => {
                        // FIXME(simulacrum): Don't construct Rc here
                        spot.insert(Rc::new(res.next().unwrap()));
                    }
                    Occupied(..) => {
                        return Err((sp, format!("duplicated bind name: {}", bind_name)))
                    }
                }
            }
            TokenTree::MetaVar(..) | TokenTree::Token(..) => (),
        }

        Ok(())
    }

    let mut ret_val = HashMap::new();
    for m in ms {
        match n_rec(sess, m, res.by_ref(), &mut ret_val) {
            Ok(_) => {}
            Err((sp, msg)) => return Error(sp, msg),
        }
    }

    Success(ret_val)
}

/// Generate an appropriate parsing failure message. For EOF, this is "unexpected end...". For
/// other tokens, this is "unexpected token...".
pub fn parse_failure_msg(tok: Token) -> String {
    match tok {
        token::Eof => "unexpected end of macro invocation".to_string(),
        _ => format!(
            "no rules expected the token `{}`",
            pprust::token_to_string(&tok)
        ),
    }
}

/// Perform a token equality check, ignoring syntax context (that is, an unhygienic comparison)
fn token_name_eq(t1: &Token, t2: &Token) -> bool {
    if let (Some((id1, is_raw1)), Some((id2, is_raw2))) = (t1.ident(), t2.ident()) {
        id1.name == id2.name && is_raw1 == is_raw2
    } else if let (Some(id1), Some(id2)) = (t1.lifetime(), t2.lifetime()) {
        id1.name == id2.name
    } else {
        *t1 == *t2
    }
}

/// Process the matcher positions of `cur_items` until it is empty. In the process, this will
/// produce more items in `next_items`, `eof_items`, and `bb_items`.
///
/// For more info about how this happens, see the module-level doc comments and the inline
/// comments of this function.
///
/// # Parameters
///
/// - `sess`: the parsing session into which errors are emitted.
/// - `cur_items`: the set of current items to be processed. This should be empty by the end of a
///   successful execution of this function.
/// - `next_items`: the set of newly generated items. These are used to replenish `cur_items` in
///   the function `parse`.
/// - `eof_items`: the set of items that would be valid if this was the EOF.
/// - `bb_items`: the set of items that are waiting for the black-box parser.
/// - `token`: the current token of the parser.
/// - `span`: the `Span` in the source code corresponding to the token trees we are trying to match
///   against the matcher positions in `cur_items`.
///
/// # Returns
///
/// A `ParseResult`. Note that matches are kept track of through the items generated.
fn inner_parse_loop<'a>(
    sess: &ParseSess,
    cur_items: &mut OneVector<MatcherPosHandle<'a>>,
    next_items: &mut Vec<MatcherPosHandle<'a>>,
    eof_items: &mut OneVector<MatcherPosHandle<'a>>,
    bb_items: &mut OneVector<MatcherPosHandle<'a>>,
    token: &Token,
    span: syntax_pos::Span,
) -> ParseResult<()> {
    // Pop items from `cur_items` until it is empty.
    while let Some(mut item) = cur_items.pop() {
        // When unzipped trees end, remove them. This corresponds to backtracking out of a
        // delimited submatcher into which we already descended. In backtracking out again, we need
        // to advance the "dot" past the delimiters in the outer matcher.
        while item.idx >= item.top_elts.len() {
            match item.stack.pop() {
                Some(MatcherTtFrame { elts, idx }) => {
                    item.top_elts = elts;
                    item.idx = idx + 1;
                }
                None => break,
            }
        }

        // Get the current position of the "dot" (`idx`) in `item` and the number of token trees in
        // the matcher (`len`).
        let idx = item.idx;
        let len = item.top_elts.len();

        // If `idx >= len`, then we are at or past the end of the matcher of `item`.
        if idx >= len {
            // We are repeating iff there is a parent. If the matcher is inside of a repetition,
            // then we could be at the end of a sequence or at the beginning of the next
            // repetition.
            if item.up.is_some() {
                // At this point, regardless of whether there is a separator, we should add all
                // matches from the complete repetition of the sequence to the shared, top-level
                // `matches` list (actually, `up.matches`, which could itself not be the top-level,
                // but anyway...). Moreover, we add another item to `cur_items` in which the "dot"
                // is at the end of the `up` matcher. This ensures that the "dot" in the `up`
                // matcher is also advanced sufficiently.
                //
                // NOTE: removing the condition `idx == len` allows trailing separators.
                if idx == len {
                    // Get the `up` matcher
                    let mut new_pos = item.up.clone().unwrap();

                    // Add matches from this repetition to the `matches` of `up`
                    for idx in item.match_lo..item.match_hi {
                        let sub = item.matches[idx].clone();
                        let span = span.with_lo(item.sp_lo);
                        new_pos.push_match(idx, MatchedSeq(sub, span));
                    }

                    // Move the "dot" past the repetition in `up`
                    new_pos.match_cur = item.match_hi;
                    new_pos.idx += 1;
                    cur_items.push(new_pos);
                }

                // Check if we need a separator.
                if idx == len && item.sep.is_some() {
                    // We have a separator, and it is the current token. We can advance past the
                    // separator token.
                    if item.sep
                        .as_ref()
                        .map(|sep| token_name_eq(token, sep))
                        .unwrap_or(false)
                    {
                        item.idx += 1;
                        next_items.push(item);
                    }
                }
                // We don't need a separator. Move the "dot" back to the beginning of the matcher
                // and try to match again UNLESS we are only allowed to have _one_ repetition.
                else if item.seq_op != Some(quoted::KleeneOp::ZeroOrOne) {
                    item.match_cur = item.match_lo;
                    item.idx = 0;
                    cur_items.push(item);
                }
            }
            // If we are not in a repetition, then being at the end of a matcher means that we have
            // reached the potential end of the input.
            else {
                eof_items.push(item);
            }
        }
        // We are in the middle of a matcher.
        else {
            // Look at what token in the matcher we are trying to match the current token (`token`)
            // against. Depending on that, we may generate new items.
            match item.top_elts.get_tt(idx) {
                // Need to descend into a sequence
                TokenTree::Sequence(sp, seq) => {
                    // Examine the case where there are 0 matches of this sequence
                    if seq.op == quoted::KleeneOp::ZeroOrMore
                        || seq.op == quoted::KleeneOp::ZeroOrOne
                    {
                        let mut new_item = item.clone();
                        new_item.match_cur += seq.num_captures;
                        new_item.idx += 1;
                        for idx in item.match_cur..item.match_cur + seq.num_captures {
                            new_item.push_match(idx, MatchedSeq(Rc::new(vec![]), sp));
                        }
                        cur_items.push(new_item);
                    }

                    let matches = create_matches(item.matches.len());
                    cur_items.push(MatcherPosHandle::Box(Box::new(MatcherPos {
                        stack: vec![],
                        sep: seq.separator.clone(),
                        seq_op: Some(seq.op),
                        idx: 0,
                        matches,
                        match_lo: item.match_cur,
                        match_cur: item.match_cur,
                        match_hi: item.match_cur + seq.num_captures,
                        up: Some(item),
                        sp_lo: sp.lo(),
                        top_elts: Tt(TokenTree::Sequence(sp, seq)),
                    })));
                }

                // We need to match a metavar (but the identifier is invalid)... this is an error
                TokenTree::MetaVarDecl(span, _, id) if id.name == keywords::Invalid.name() => {
                    if sess.missing_fragment_specifiers.borrow_mut().remove(&span) {
                        return Error(span, "missing fragment specifier".to_string());
                    }
                }

                // We need to match a metavar with a valid ident... call out to the black-box
                // parser by adding an item to `bb_items`.
                TokenTree::MetaVarDecl(_, _, id) => {
                    // Built-in nonterminals never start with these tokens,
                    // so we can eliminate them from consideration.
                    if may_begin_with(&*id.as_str(), token) {
                        bb_items.push(item);
                    }
                }

                // We need to descend into a delimited submatcher or a doc comment. To do this, we
                // push the current matcher onto a stack and push a new item containing the
                // submatcher onto `cur_items`.
                //
                // At the beginning of the loop, if we reach the end of the delimited submatcher,
                // we pop the stack to backtrack out of the descent.
                seq @ TokenTree::Delimited(..) | seq @ TokenTree::Token(_, DocComment(..)) => {
                    let lower_elts = mem::replace(&mut item.top_elts, Tt(seq));
                    let idx = item.idx;
                    item.stack.push(MatcherTtFrame {
                        elts: lower_elts,
                        idx,
                    });
                    item.idx = 0;
                    cur_items.push(item);
                }

                // We just matched a normal token. We can just advance the parser.
                TokenTree::Token(_, ref t) if token_name_eq(t, token) => {
                    item.idx += 1;
                    next_items.push(item);
                }

                // There was another token that was not `token`... This means we can't add any
                // rules. NOTE that this is not necessarily an error unless _all_ items in
                // `cur_items` end up doing this. There may still be some other matchers that do
                // end up working out.
                TokenTree::Token(..) | TokenTree::MetaVar(..) => {}
            }
        }
    }

    // Yay a successful parse (so far)!
    Success(())
}

/// Use the given sequence of token trees (`ms`) as a matcher. Match the given token stream `tts`
/// against it and return the match.
///
/// # Parameters
///
/// - `sess`: The session into which errors are emitted
/// - `tts`: The tokenstream we are matching against the pattern `ms`
/// - `ms`: A sequence of token trees representing a pattern against which we are matching
/// - `directory`: Information about the file locations (needed for the black-box parser)
/// - `recurse_into_modules`: Whether or not to recurse into modules (needed for the black-box
///   parser)
pub fn parse(
    sess: &ParseSess,
    tts: TokenStream,
    ms: &[TokenTree],
    directory: Option<Directory>,
    recurse_into_modules: bool,
) -> NamedParseResult {
    // Create a parser that can be used for the "black box" parts.
    let mut parser = Parser::new(sess, tts, directory, recurse_into_modules, true);

    // A queue of possible matcher positions. We initialize it with the matcher position in which
    // the "dot" is before the first token of the first token tree in `ms`. `inner_parse_loop` then
    // processes all of these possible matcher positions and produces possible next positions into
    // `next_items`. After some post-processing, the contents of `next_items` replenish `cur_items`
    // and we start over again.
    //
    // This MatcherPos instance is allocated on the stack. All others -- and
    // there are frequently *no* others! -- are allocated on the heap.
    let mut initial = initial_matcher_pos(ms, parser.span.lo());
    let mut cur_items = smallvec![MatcherPosHandle::Ref(&mut initial)];
    let mut next_items = Vec::new();

    loop {
        // Matcher positions black-box parsed by parser.rs (`parser`)
        let mut bb_items = OneVector::new();

        // Matcher positions that would be valid if the macro invocation was over now
        let mut eof_items = OneVector::new();
        assert!(next_items.is_empty());

        // Process `cur_items` until either we have finished the input or we need to get some
        // parsing from the black-box parser done. The result is that `next_items` will contain a
        // bunch of possible next matcher positions in `next_items`.
        match inner_parse_loop(
            sess,
            &mut cur_items,
            &mut next_items,
            &mut eof_items,
            &mut bb_items,
            &parser.token,
            parser.span,
        ) {
            Success(_) => {}
            Failure(sp, tok) => return Failure(sp, tok),
            Error(sp, msg) => return Error(sp, msg),
        }

        // inner parse loop handled all cur_items, so it's empty
        assert!(cur_items.is_empty());

        // We need to do some post processing after the `inner_parser_loop`.
        //
        // Error messages here could be improved with links to original rules.

        // If we reached the EOF, check that there is EXACTLY ONE possible matcher. Otherwise,
        // either the parse is ambiguous (which should never happen) or their is a syntax error.
        if token_name_eq(&parser.token, &token::Eof) {
            if eof_items.len() == 1 {
                let matches = eof_items[0]
                    .matches
                    .iter_mut()
                    .map(|dv| Rc::make_mut(dv).pop().unwrap());
                return nameize(sess, ms, matches);
            } else if eof_items.len() > 1 {
                return Error(
                    parser.span,
                    "ambiguity: multiple successful parses".to_string(),
                );
            } else {
                return Failure(parser.span, token::Eof);
            }
        }
        // Performance hack: eof_items may share matchers via Rc with other things that we want
        // to modify. Dropping eof_items now may drop these refcounts to 1, preventing an
        // unnecessary implicit clone later in Rc::make_mut.
        drop(eof_items);

        // Another possibility is that we need to call out to parse some rust nonterminal
        // (black-box) parser. However, if there is not EXACTLY ONE of these, something is wrong.
        if (!bb_items.is_empty() && !next_items.is_empty()) || bb_items.len() > 1 {
            let nts = bb_items
                .iter()
                .map(|item| match item.top_elts.get_tt(item.idx) {
                    TokenTree::MetaVarDecl(_, bind, name) => format!("{} ('{}')", name, bind),
                    _ => panic!(),
                })
                .collect::<Vec<String>>()
                .join(" or ");

            return Error(
                parser.span,
                format!(
                    "local ambiguity: multiple parsing options: {}",
                    match next_items.len() {
                        0 => format!("built-in NTs {}.", nts),
                        1 => format!("built-in NTs {} or 1 other option.", nts),
                        n => format!("built-in NTs {} or {} other options.", nts, n),
                    }
                ),
            );
        }
        // If there are no possible next positions AND we aren't waiting for the black-box parser,
        // then their is a syntax error.
        else if bb_items.is_empty() && next_items.is_empty() {
            return Failure(parser.span, parser.token);
        }
        // Dump all possible `next_items` into `cur_items` for the next iteration.
        else if !next_items.is_empty() {
            // Now process the next token
            cur_items.extend(next_items.drain(..));
            parser.bump();
        }
        // Finally, we have the case where we need to call the black-box parser to get some
        // nonterminal.
        else {
            assert_eq!(bb_items.len(), 1);

            let mut item = bb_items.pop().unwrap();
            if let TokenTree::MetaVarDecl(span, _, ident) = item.top_elts.get_tt(item.idx) {
                let match_cur = item.match_cur;
                item.push_match(
                    match_cur,
                    MatchedNonterminal(Rc::new(parse_nt(&mut parser, span, &ident.as_str()))),
                );
                item.idx += 1;
                item.match_cur += 1;
            } else {
                unreachable!()
            }
            cur_items.push(item);
        }

        assert!(!cur_items.is_empty());
    }
}

/// The token is an identifier, but not `_`.
/// We prohibit passing `_` to macros expecting `ident` for now.
fn get_macro_ident(token: &Token) -> Option<(Ident, bool)> {
    match *token {
        token::Ident(ident, is_raw) if ident.name != keywords::Underscore.name() =>
            Some((ident, is_raw)),
        _ => None,
    }
}

/// Checks whether a non-terminal may begin with a particular token.
///
/// Returning `false` is a *stability guarantee* that such a matcher will *never* begin with that
/// token. Be conservative (return true) if not sure.
fn may_begin_with(name: &str, token: &Token) -> bool {
    /// Checks whether the non-terminal may contain a single (non-keyword) identifier.
    fn may_be_ident(nt: &token::Nonterminal) -> bool {
        match *nt {
            token::NtItem(_) | token::NtBlock(_) | token::NtVis(_) => false,
            _ => true,
        }
    }

    match name {
        "expr" => token.can_begin_expr(),
        "ty" => token.can_begin_type(),
        "ident" => get_macro_ident(token).is_some(),
        "literal" => token.can_begin_literal_or_bool(),
        "vis" => match *token {
            // The follow-set of :vis + "priv" keyword + interpolated
            Token::Comma | Token::Ident(..) | Token::Interpolated(_) => true,
            _ => token.can_begin_type(),
        },
        "block" => match *token {
            Token::OpenDelim(token::Brace) => true,
            Token::Interpolated(ref nt) => match nt.0 {
                token::NtItem(_)
                | token::NtPat(_)
                | token::NtTy(_)
                | token::NtIdent(..)
                | token::NtMeta(_)
                | token::NtPath(_)
                | token::NtVis(_) => false, // none of these may start with '{'.
                _ => true,
            },
            _ => false,
        },
        "path" | "meta" => match *token {
            Token::ModSep | Token::Ident(..) => true,
            Token::Interpolated(ref nt) => match nt.0 {
                token::NtPath(_) | token::NtMeta(_) => true,
                _ => may_be_ident(&nt.0),
            },
            _ => false,
        },
        "pat" => match *token {
            Token::Ident(..) |               // box, ref, mut, and other identifiers (can stricten)
            Token::OpenDelim(token::Paren) |    // tuple pattern
            Token::OpenDelim(token::Bracket) |  // slice pattern
            Token::BinOp(token::And) |          // reference
            Token::BinOp(token::Minus) |        // negative literal
            Token::AndAnd |                     // double reference
            Token::Literal(..) |                // literal
            Token::DotDot |                     // range pattern (future compat)
            Token::DotDotDot |                  // range pattern (future compat)
            Token::ModSep |                     // path
            Token::Lt |                         // path (UFCS constant)
            Token::BinOp(token::Shl) => true,   // path (double UFCS)
            Token::Interpolated(ref nt) => may_be_ident(&nt.0),
            _ => false,
        },
        "lifetime" => match *token {
            Token::Lifetime(_) => true,
            Token::Interpolated(ref nt) => match nt.0 {
                token::NtLifetime(_) | token::NtTT(_) => true,
                _ => false,
            },
            _ => false,
        },
        _ => match *token {
            token::CloseDelim(_) => false,
            _ => true,
        },
    }
}

/// A call to the "black-box" parser to parse some rust nonterminal.
///
/// # Parameters
///
/// - `p`: the "black-box" parser to use
/// - `sp`: the `Span` we want to parse
/// - `name`: the name of the metavar _matcher_ we want to match (e.g. `tt`, `ident`, `block`,
///   etc...)
///
/// # Returns
///
/// The parsed nonterminal.
fn parse_nt<'a>(p: &mut Parser<'a>, sp: Span, name: &str) -> Nonterminal {
    if name == "tt" {
        return token::NtTT(p.parse_token_tree());
    }
    // check at the beginning and the parser checks after each bump
    p.process_potential_macro_variable();
    match name {
        "item" => match panictry!(p.parse_item()) {
            Some(i) => token::NtItem(i),
            None => {
                p.fatal("expected an item keyword").emit();
                FatalError.raise();
            }
        },
        "block" => token::NtBlock(panictry!(p.parse_block())),
        "stmt" => match panictry!(p.parse_stmt()) {
            Some(s) => token::NtStmt(s),
            None => {
                p.fatal("expected a statement").emit();
                FatalError.raise();
            }
        },
        "pat" => token::NtPat(panictry!(p.parse_pat())),
        "expr" => token::NtExpr(panictry!(p.parse_expr())),
        "literal" => token::NtLiteral(panictry!(p.parse_literal_maybe_minus())),
        "ty" => token::NtTy(panictry!(p.parse_ty())),
        // this could be handled like a token, since it is one
        "ident" => if let Some((ident, is_raw)) = get_macro_ident(&p.token) {
            let span = p.span;
            p.bump();
            token::NtIdent(Ident::new(ident.name, span), is_raw)
        } else {
            let token_str = pprust::token_to_string(&p.token);
            p.fatal(&format!("expected ident, found {}", &token_str)).emit();
            FatalError.raise()
        }
        "path" => token::NtPath(panictry!(p.parse_path_common(PathStyle::Type, false))),
        "meta" => token::NtMeta(panictry!(p.parse_meta_item())),
        "vis" => token::NtVis(panictry!(p.parse_visibility(true))),
        "lifetime" => if p.check_lifetime() {
            token::NtLifetime(p.expect_lifetime().ident)
        } else {
            let token_str = pprust::token_to_string(&p.token);
            p.fatal(&format!("expected a lifetime, found `{}`", &token_str)).emit();
            FatalError.raise();
        }
        // this is not supposed to happen, since it has been checked
        // when compiling the macro.
        _ => p.span_bug(sp, "invalid fragment specifier"),
    }
}
