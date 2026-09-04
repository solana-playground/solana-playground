import * as monaco from "monaco-editor";

import * as lsp from "./protocol";
import { PgCommon } from "../../../../../../utils";

/**
 * Map a server-side document URI to the Monaco model URI it belongs to.
 *
 * Returns `null` for documents outside the project (e.g. crate sources in the
 * registry) which the editor cannot open.
 */
export type ToModelUri = (uri: string) => monaco.Uri | null;

/* -------------------------------- Positions ------------------------------- */

/** LSP positions are zero-based; Monaco's are one-based. */
export const toMonacoPosition = (pos: lsp.Position): monaco.IPosition => ({
  lineNumber: pos.line + 1,
  column: pos.character + 1,
});

export const toMonacoRange = (range: lsp.Range): monaco.IRange => ({
  startLineNumber: range.start.line + 1,
  startColumn: range.start.character + 1,
  endLineNumber: range.end.line + 1,
  endColumn: range.end.character + 1,
});

export const toLspPosition = (pos: monaco.IPosition): lsp.Position => ({
  line: pos.lineNumber - 1,
  character: pos.column - 1,
});

export const toLspRange = (range: monaco.IRange): lsp.Range => ({
  start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
  end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
});

/* ------------------------------- Text edits ------------------------------- */

export const toMonacoTextEdit = (
  edit: lsp.TextEdit
): monaco.languages.TextEdit => ({
  range: toMonacoRange(edit.range),
  text: edit.newText,
});

export const toMonacoWorkspaceEdit = (
  edit: lsp.WorkspaceEdit,
  toModelUri: ToModelUri
): monaco.languages.WorkspaceEdit => {
  const edits: monaco.languages.IWorkspaceTextEdit[] = [];

  const push = (uri: string, textEdits: lsp.TextEdit[], version?: number) => {
    const resource = toModelUri(uri);
    if (!resource) return;
    for (const textEdit of textEdits) {
      edits.push({
        resource,
        textEdit: toMonacoTextEdit(textEdit),
        versionId: version,
      });
    }
  };

  for (const uri in edit.changes) push(uri, edit.changes[uri]);
  for (const change of edit.documentChanges ?? []) {
    // File operations (create/rename/delete) are not supported
    if (!("textDocument" in change)) continue;
    push(
      change.textDocument.uri,
      change.edits,
      change.textDocument.version ?? undefined
    );
  }

  return { edits };
};

/* -------------------------------- Markup --------------------------------- */

const toMarkdownString = (
  content: string | lsp.MarkupContent | lsp.MarkedString
): monaco.IMarkdownString => {
  if (typeof content === "string") return { value: content };
  if ("kind" in content) return { value: content.value };
  return { value: `\`\`\`${content.language}\n${content.value}\n\`\`\`` };
};

export const toMonacoHover = (hover: lsp.Hover): monaco.languages.Hover => {
  const contents = PgCommon.toArray(hover.contents).map(toMarkdownString);
  return {
    contents,
    range: hover.range ? toMonacoRange(hover.range) : undefined,
  };
};

/* ------------------------------ Diagnostics ------------------------------ */

const toMarkerSeverity = (severity?: lsp.DiagnosticSeverity) => {
  switch (severity) {
    case lsp.DiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;
    case lsp.DiagnosticSeverity.Information:
      return monaco.MarkerSeverity.Info;
    case lsp.DiagnosticSeverity.Hint:
      return monaco.MarkerSeverity.Hint;
    default:
      return monaco.MarkerSeverity.Error;
  }
};

const toMarkerTag = (tag: lsp.DiagnosticTag) => {
  switch (tag) {
    case lsp.DiagnosticTag.Deprecated:
      return monaco.MarkerTag.Deprecated;
    default:
      return monaco.MarkerTag.Unnecessary;
  }
};

export const toMonacoMarker = (
  diagnostic: lsp.Diagnostic,
  toModelUri: ToModelUri
): monaco.editor.IMarkerData => ({
  ...toMonacoRange(diagnostic.range),
  severity: toMarkerSeverity(diagnostic.severity),
  message: diagnostic.message,
  code: diagnostic.code?.toString(),
  source: diagnostic.source,
  tags: diagnostic.tags?.map(toMarkerTag),
  relatedInformation: diagnostic.relatedInformation
    ?.map((info) => {
      const resource = toModelUri(info.location.uri);
      if (!resource) return null;
      return {
        resource,
        message: info.message,
        ...toMonacoRange(info.location.range),
      };
    })
    .filter(PgCommon.isNonNullish),
});

/* ------------------------------- Completion ------------------------------ */

/** LSP -> Monaco `CompletionItemKind` (the enums differ in numbering) */
const COMPLETION_KINDS: {
  [K in lsp.CompletionItemKind]: monaco.languages.CompletionItemKind;
} = {
  [lsp.CompletionItemKind.Text]: monaco.languages.CompletionItemKind.Text,
  [lsp.CompletionItemKind.Method]: monaco.languages.CompletionItemKind.Method,
  [lsp.CompletionItemKind.Function]:
    monaco.languages.CompletionItemKind.Function,
  [lsp.CompletionItemKind.Constructor]:
    monaco.languages.CompletionItemKind.Constructor,
  [lsp.CompletionItemKind.Field]: monaco.languages.CompletionItemKind.Field,
  [lsp.CompletionItemKind.Variable]:
    monaco.languages.CompletionItemKind.Variable,
  [lsp.CompletionItemKind.Class]: monaco.languages.CompletionItemKind.Class,
  [lsp.CompletionItemKind.Interface]:
    monaco.languages.CompletionItemKind.Interface,
  [lsp.CompletionItemKind.Module]: monaco.languages.CompletionItemKind.Module,
  [lsp.CompletionItemKind.Property]:
    monaco.languages.CompletionItemKind.Property,
  [lsp.CompletionItemKind.Unit]: monaco.languages.CompletionItemKind.Unit,
  [lsp.CompletionItemKind.Value]: monaco.languages.CompletionItemKind.Value,
  [lsp.CompletionItemKind.Enum]: monaco.languages.CompletionItemKind.Enum,
  [lsp.CompletionItemKind.Keyword]: monaco.languages.CompletionItemKind.Keyword,
  [lsp.CompletionItemKind.Snippet]: monaco.languages.CompletionItemKind.Snippet,
  [lsp.CompletionItemKind.Color]: monaco.languages.CompletionItemKind.Color,
  [lsp.CompletionItemKind.File]: monaco.languages.CompletionItemKind.File,
  [lsp.CompletionItemKind.Reference]:
    monaco.languages.CompletionItemKind.Reference,
  [lsp.CompletionItemKind.Folder]: monaco.languages.CompletionItemKind.Folder,
  [lsp.CompletionItemKind.EnumMember]:
    monaco.languages.CompletionItemKind.EnumMember,
  [lsp.CompletionItemKind.Constant]:
    monaco.languages.CompletionItemKind.Constant,
  [lsp.CompletionItemKind.Struct]: monaco.languages.CompletionItemKind.Struct,
  [lsp.CompletionItemKind.Event]: monaco.languages.CompletionItemKind.Event,
  [lsp.CompletionItemKind.Operator]:
    monaco.languages.CompletionItemKind.Operator,
  [lsp.CompletionItemKind.TypeParameter]:
    monaco.languages.CompletionItemKind.TypeParameter,
};

export const toMonacoCompletionItem = (
  item: lsp.CompletionItem,
  /** Range to replace when the server does not send a text edit */
  fallbackRange: monaco.languages.CompletionItem["range"]
): monaco.languages.CompletionItem & { data?: unknown } => {
  let insertText = item.insertText ?? item.label;
  let range: monaco.languages.CompletionItem["range"] = fallbackRange;
  if (item.textEdit) {
    insertText = item.textEdit.newText;
    range =
      "range" in item.textEdit
        ? toMonacoRange(item.textEdit.range)
        : {
            insert: toMonacoRange(item.textEdit.insert),
            replace: toMonacoRange(item.textEdit.replace),
          };
  }

  const deprecated =
    item.deprecated || item.tags?.includes(lsp.CompletionItemTag.Deprecated);

  return {
    label: item.label,
    kind: item.kind
      ? COMPLETION_KINDS[item.kind]
      : monaco.languages.CompletionItemKind.Text,
    tags: deprecated ? [monaco.languages.CompletionItemTag.Deprecated] : [],
    detail: item.detail ?? item.labelDetails?.description,
    documentation: item.documentation
      ? toMarkdownString(item.documentation)
      : undefined,
    sortText: item.sortText,
    filterText: item.filterText,
    preselect: item.preselect,
    insertText,
    insertTextRules:
      item.insertTextFormat === lsp.InsertTextFormat.Snippet
        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        : undefined,
    range,
    commitCharacters: item.commitCharacters,
    additionalTextEdits: item.additionalTextEdits?.map(toMonacoTextEdit),
    // Kept for `completionItem/resolve`
    data: item.data,
  };
};

/* ----------------------------- Signature help ---------------------------- */

export const toMonacoSignatureHelp = (
  help: lsp.SignatureHelp
): monaco.languages.SignatureHelp => ({
  signatures: help.signatures.map((signature) => ({
    label: signature.label,
    documentation: signature.documentation
      ? toMarkdownString(signature.documentation)
      : undefined,
    parameters:
      signature.parameters?.map((parameter) => ({
        label: parameter.label,
        documentation: parameter.documentation
          ? toMarkdownString(parameter.documentation)
          : undefined,
      })) ?? [],
    activeParameter: signature.activeParameter,
  })),
  activeSignature: help.activeSignature ?? 0,
  activeParameter: help.activeParameter ?? 0,
});

/* -------------------------------- Locations ------------------------------ */

export const toMonacoDefinitions = (
  result: lsp.Location | Array<lsp.Location | lsp.LocationLink> | null,
  toModelUri: ToModelUri
): monaco.languages.LocationLink[] => {
  if (!result) return [];
  return PgCommon.toArray(result)
    .map((location) => {
      if ("targetUri" in location) {
        const uri = toModelUri(location.targetUri);
        if (!uri) return null;
        return {
          uri,
          range: toMonacoRange(location.targetSelectionRange),
          originSelectionRange: location.originSelectionRange
            ? toMonacoRange(location.originSelectionRange)
            : undefined,
        };
      }

      const uri = toModelUri(location.uri);
      if (!uri) return null;
      return { uri, range: toMonacoRange(location.range) };
    })
    .filter(PgCommon.isNonNullish);
};

export const toMonacoDocumentHighlight = (
  highlight: lsp.DocumentHighlight
): monaco.languages.DocumentHighlight => ({
  range: toMonacoRange(highlight.range),
  // Both enums order the kinds as Text, Read, Write; LSP starts at 1
  kind: highlight.kind ? highlight.kind - 1 : undefined,
});

/* -------------------------------- Symbols -------------------------------- */

export const toMonacoDocumentSymbol = (
  symbol: lsp.DocumentSymbol
): monaco.languages.DocumentSymbol => ({
  name: symbol.name,
  detail: symbol.detail ?? "",
  // Both enums list the kinds in the same order; LSP starts at 1
  kind: symbol.kind - 1,
  tags: [],
  range: toMonacoRange(symbol.range),
  selectionRange: toMonacoRange(symbol.selectionRange),
  children: symbol.children?.map(toMonacoDocumentSymbol),
});

/* ------------------------------- Inlay hints ----------------------------- */

export const toMonacoInlayHint = (
  hint: lsp.InlayHint
): monaco.languages.InlayHint => ({
  position: toMonacoPosition(hint.position),
  label:
    typeof hint.label === "string"
      ? hint.label
      : hint.label.map((part) => ({
          label: part.value,
          tooltip: part.tooltip ? toMarkdownString(part.tooltip) : undefined,
        })),
  kind:
    hint.kind === lsp.InlayHintKind.Parameter
      ? monaco.languages.InlayHintKind.Parameter
      : monaco.languages.InlayHintKind.Type,
  tooltip: hint.tooltip ? toMarkdownString(hint.tooltip) : undefined,
  paddingLeft: hint.paddingLeft,
  paddingRight: hint.paddingRight,
});

/* --------------------------------- Folding ------------------------------- */

const FOLDING_KINDS = {
  comment: monaco.languages.FoldingRangeKind.Comment,
  imports: monaco.languages.FoldingRangeKind.Imports,
  region: monaco.languages.FoldingRangeKind.Region,
};

export const toMonacoFoldingRange = (
  range: lsp.FoldingRange
): monaco.languages.FoldingRange => ({
  start: range.startLine + 1,
  end: range.endLine + 1,
  kind: range.kind ? FOLDING_KINDS[range.kind] : undefined,
});
