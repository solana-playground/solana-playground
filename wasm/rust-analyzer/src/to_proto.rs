//! Conversion of `rust-analyzer` specific types to `return_types` equivalents.

use ide_db::rust_doc::is_rust_fence;

use crate::return_types;

/// Convert text range.
pub(crate) fn text_range(
    range: ide::TextRange,
    line_index: &ide::LineIndex,
) -> return_types::Range {
    let start = line_index.line_col(range.start());
    let end = line_index.line_col(range.end());

    return_types::Range {
        start_line_number: start.line + 1,
        start_column: start.col + 1,
        end_line_number: end.line + 1,
        end_column: end.col + 1,
    }
}

/// Convert completion item kind.
pub(crate) fn completion_item_kind(
    kind: ide::CompletionItemKind,
) -> return_types::CompletionItemKind {
    use return_types::CompletionItemKind::*;
    match kind {
        ide::CompletionItemKind::Binding => Variable,
        ide::CompletionItemKind::BuiltinType => Struct,
        ide::CompletionItemKind::Keyword => Keyword,
        ide::CompletionItemKind::Snippet => Snippet,
        ide::CompletionItemKind::Method => Method,
        ide::CompletionItemKind::UnresolvedReference => User,
        ide::CompletionItemKind::SymbolKind(it) => match it {
            ide::SymbolKind::Attribute => Function,
            ide::SymbolKind::BuiltinAttr => Function,
            ide::SymbolKind::Const => Constant,
            ide::SymbolKind::ConstParam => Constant,
            ide::SymbolKind::Derive => Function,
            ide::SymbolKind::Enum => Enum,
            ide::SymbolKind::Field => Field,
            ide::SymbolKind::Function => Function,
            ide::SymbolKind::Impl => Interface,
            ide::SymbolKind::Label => Constant,
            ide::SymbolKind::LifetimeParam => TypeParameter,
            ide::SymbolKind::Local => Variable,
            ide::SymbolKind::Macro => Function,
            ide::SymbolKind::Module => Module,
            ide::SymbolKind::SelfParam => Value,
            ide::SymbolKind::SelfType => TypeParameter,
            ide::SymbolKind::Static => Value,
            ide::SymbolKind::Struct => Struct,
            ide::SymbolKind::Trait => Interface,
            ide::SymbolKind::TypeAlias => Value,
            ide::SymbolKind::TypeParam => TypeParameter,
            ide::SymbolKind::ToolModule => Module,
            ide::SymbolKind::Union => Struct,
            ide::SymbolKind::ValueParam => TypeParameter,
            ide::SymbolKind::Variant => User,
        },
    }
}

/// Convert severity.
pub(crate) fn severity(s: ide::Severity) -> return_types::MarkerSeverity {
    match s {
        ide::Severity::Error => return_types::MarkerSeverity::Error,
        ide::Severity::WeakWarning => return_types::MarkerSeverity::Hint,
    }
}
/// Convert text edit.
pub(crate) fn text_edit(indel: &ide::Indel, line_index: &ide::LineIndex) -> return_types::TextEdit {
    let text = indel.insert.clone();
    return_types::TextEdit {
        range: text_range(indel.delete, line_index),
        text,
    }
}
/// Convert text edits.
pub(crate) fn text_edits(edit: ide::TextEdit, ctx: &ide::LineIndex) -> Vec<return_types::TextEdit> {
    edit.iter().map(|atom| text_edit(atom, ctx)).collect()
}

/// Convert completion item.
pub(crate) fn completion_item(
    item: ide::CompletionItem,
    line_index: &ide::LineIndex,
) -> return_types::CompletionItem {
    let mut additional_text_edits = Vec::new();
    let mut edit = None;
    // LSP does not allow arbitrary edits in completion, so we have to do a
    // non-trivial mapping here.
    for atom_edit in item.text_edit().iter() {
        if item.source_range().contains_range(atom_edit.delete) {
            edit = Some(if atom_edit.delete == item.source_range() {
                text_edit(atom_edit, line_index)
            } else {
                assert!(item.source_range().end() == atom_edit.delete.end());
                let range1 =
                    ide::TextRange::new(atom_edit.delete.start(), item.source_range().start());
                let range2 = item.source_range();
                let edit1 = ide::Indel::replace(range1, String::new());
                let edit2 = ide::Indel::replace(range2, atom_edit.insert.clone());
                additional_text_edits.push(text_edit(&edit1, line_index));
                text_edit(&edit2, line_index)
            })
        } else {
            edit = Some(text_edit(atom_edit, line_index));
        }
    }
    let return_types::TextEdit { range, text } = edit.unwrap();

    return_types::CompletionItem {
        kind: completion_item_kind(item.kind()),
        label: item.label().to_string(),
        range,
        detail: item.detail().map(|it| it.to_string()),
        insert_text: text,
        insert_text_rules: if item.is_snippet() {
            return_types::CompletionItemInsertTextRule::InsertAsSnippet
        } else {
            return_types::CompletionItemInsertTextRule::None
        },
        documentation: item
            .documentation()
            .map(|doc| markdown_string(doc.as_str())),
        filter_text: item.lookup().to_string(),
        additional_text_edits,
    }
}

/// Convert signature information.
pub(crate) fn signature_information(
    call_info: ide::CallInfo,
) -> return_types::SignatureInformation {
    use return_types::{ParameterInformation, SignatureInformation};

    let label = call_info.signature.clone();
    let documentation = call_info.doc.as_ref().map(|doc| markdown_string(doc));

    let parameters = call_info
        .parameter_labels()
        .into_iter()
        .map(|param| ParameterInformation {
            label: param.to_string(),
        })
        .collect();

    SignatureInformation {
        label,
        documentation,
        parameters,
    }
}

/// Convert location links.
pub(crate) fn location_links(
    nav_info: ide::RangeInfo<Vec<ide::NavigationTarget>>,
    line_index: &ide::LineIndex,
) -> Vec<return_types::LocationLink> {
    let selection = text_range(nav_info.range, line_index);
    nav_info
        .info
        .into_iter()
        .map(|nav| {
            let range = text_range(nav.full_range, line_index);

            let target_selection_range = nav
                .focus_range
                .map(|it| text_range(it, line_index))
                .unwrap_or(range);

            return_types::LocationLink {
                origin_selection_range: selection,
                range,
                target_selection_range,
            }
        })
        .collect()
}

/// Convert symbol kind.
pub(crate) fn symbol_kind(kind: ide::StructureNodeKind) -> return_types::SymbolKind {
    use return_types::SymbolKind;

    let kind = match kind {
        ide::StructureNodeKind::SymbolKind(it) => it,
        ide::StructureNodeKind::Region => return SymbolKind::Property,
    };

    match kind {
        ide::SymbolKind::Attribute => SymbolKind::Function,
        ide::SymbolKind::BuiltinAttr => SymbolKind::Function,
        ide::SymbolKind::Const => SymbolKind::Constant,
        ide::SymbolKind::ConstParam => SymbolKind::Constant,
        ide::SymbolKind::Derive => SymbolKind::Function,
        ide::SymbolKind::Enum => SymbolKind::Enum,
        ide::SymbolKind::Field => SymbolKind::Field,
        ide::SymbolKind::Function => SymbolKind::Function,
        ide::SymbolKind::Impl => SymbolKind::Interface,
        ide::SymbolKind::Label => SymbolKind::Variable,
        ide::SymbolKind::LifetimeParam => SymbolKind::TypeParameter,
        ide::SymbolKind::Local => SymbolKind::Variable,
        ide::SymbolKind::Macro => SymbolKind::Function,
        ide::SymbolKind::Module => SymbolKind::Module,
        ide::SymbolKind::SelfParam => SymbolKind::Variable,
        ide::SymbolKind::Static => SymbolKind::Constant,
        ide::SymbolKind::Struct => SymbolKind::Struct,
        ide::SymbolKind::ToolModule => SymbolKind::Module,
        ide::SymbolKind::Trait => SymbolKind::Interface,
        ide::SymbolKind::TypeAlias | ide::SymbolKind::TypeParam | ide::SymbolKind::SelfType => {
            SymbolKind::TypeParameter
        }
        ide::SymbolKind::Union => SymbolKind::Struct,
        ide::SymbolKind::ValueParam => SymbolKind::Variable,
        ide::SymbolKind::Variant => SymbolKind::EnumMember,
    }
}

/// Convert folding range.
pub(crate) fn folding_range(fold: ide::Fold, ctx: &ide::LineIndex) -> return_types::FoldingRange {
    let range = text_range(fold.range, ctx);
    return_types::FoldingRange {
        start: range.start_line_number,
        end: range.end_line_number,
        kind: match fold.kind {
            ide::FoldKind::Comment => Some(return_types::FoldingRangeKind::Comment),
            ide::FoldKind::Imports => Some(return_types::FoldingRangeKind::Imports),
            ide::FoldKind::Region => Some(return_types::FoldingRangeKind::Region),
            _ => None,
        },
    }
}

/// Convert markdown string.
pub(crate) fn markdown_string(src: &str) -> return_types::MarkdownString {
    let mut processed_lines = Vec::new();
    let mut in_code_block = false;
    let mut is_rust = false;

    for mut line in src.lines() {
        if in_code_block && is_rust && code_line_ignored_by_rustdoc(line) {
            continue;
        }

        if let Some(header) = line.strip_prefix("```") {
            in_code_block ^= true;

            if in_code_block {
                is_rust = is_rust_fence(header);

                if is_rust {
                    line = "```rust";
                }
            }
        }

        if in_code_block {
            let trimmed = line.trim_start();
            if trimmed.starts_with("##") {
                line = &trimmed[1..];
            }
        }

        processed_lines.push(line);
    }

    return_types::MarkdownString {
        value: processed_lines.join("\n"),
    }
}

/// Ignore the lines that start with `#`.
fn code_line_ignored_by_rustdoc(line: &str) -> bool {
    let trimmed = line.trim();
    trimmed == "#" || trimmed.starts_with("# ") || trimmed.starts_with("#\t")
}
