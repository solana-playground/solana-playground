/**
 * The subset of the Language Server Protocol the editor uses.
 *
 * Kept local instead of depending on `vscode-languageserver-protocol`: the
 * client only needs the wire shapes below, and the package pulls the whole
 * protocol surface in for the sake of types.
 *
 * Spec: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
 */

export interface Position {
  /** Zero-based line */
  line: number;
  /** Zero-based UTF-16 character offset */
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface LocationLink {
  originSelectionRange?: Range;
  targetUri: string;
  targetRange: Range;
  targetSelectionRange: Range;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface InsertReplaceEdit {
  newText: string;
  insert: Range;
  replace: Range;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface VersionedTextDocumentIdentifier
  extends TextDocumentIdentifier {
  version: number;
}

export interface TextDocumentItem extends TextDocumentIdentifier {
  languageId: string;
  version: number;
  text: string;
}

export interface TextDocumentPositionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface MarkupContent {
  kind: "plaintext" | "markdown";
  value: string;
}

/** Legacy hover content shape, still emitted by some servers */
export type MarkedString = string | { language: string; value: string };

export interface Hover {
  contents: MarkupContent | MarkedString | MarkedString[];
  range?: Range;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export enum DiagnosticTag {
  Unnecessary = 1,
  Deprecated = 2,
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

export interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
  tags?: DiagnosticTag[];
  relatedInformation?: DiagnosticRelatedInformation[];
}

export interface PublishDiagnosticsParams {
  uri: string;
  version?: number;
  diagnostics: Diagnostic[];
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export enum InsertTextFormat {
  PlainText = 1,
  Snippet = 2,
}

export enum CompletionItemTag {
  Deprecated = 1,
}

export interface CompletionItemLabelDetails {
  detail?: string;
  description?: string;
}

export interface Command {
  title: string;
  command: string;
  arguments?: unknown[];
}

export interface CompletionItem {
  label: string;
  labelDetails?: CompletionItemLabelDetails;
  kind?: CompletionItemKind;
  tags?: CompletionItemTag[];
  detail?: string;
  documentation?: string | MarkupContent;
  deprecated?: boolean;
  preselect?: boolean;
  sortText?: string;
  filterText?: string;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
  textEdit?: TextEdit | InsertReplaceEdit;
  additionalTextEdits?: TextEdit[];
  commitCharacters?: string[];
  command?: Command;
  /** Opaque server data, echoed back in `completionItem/resolve` */
  data?: unknown;
}

export interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

export interface ParameterInformation {
  label: string | [number, number];
  documentation?: string | MarkupContent;
}

export interface SignatureInformation {
  label: string;
  documentation?: string | MarkupContent;
  parameters?: ParameterInformation[];
  activeParameter?: number;
}

export interface SignatureHelp {
  signatures: SignatureInformation[];
  activeSignature?: number;
  activeParameter?: number;
}

export enum InlayHintKind {
  Type = 1,
  Parameter = 2,
}

export interface InlayHintLabelPart {
  value: string;
  tooltip?: string | MarkupContent;
  location?: Location;
}

export interface InlayHint {
  position: Position;
  label: string | InlayHintLabelPart[];
  kind?: InlayHintKind;
  textEdits?: TextEdit[];
  tooltip?: string | MarkupContent;
  paddingLeft?: boolean;
  paddingRight?: boolean;
}

export interface TextDocumentEdit {
  textDocument: VersionedTextDocumentIdentifier & { version: number | null };
  edits: TextEdit[];
}

export interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] };
  /** Only `TextDocumentEdit`s are supported; file operations are dropped */
  documentChanges?: Array<TextDocumentEdit | { kind: string }>;
}

export type PrepareRenameResult =
  | Range
  | { range: Range; placeholder: string }
  | { defaultBehavior: boolean };

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  deprecated?: boolean;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface FoldingRange {
  startLine: number;
  startCharacter?: number;
  endLine: number;
  endCharacter?: number;
  kind?: "comment" | "imports" | "region";
}

export interface DocumentHighlight {
  range: Range;
  /** 1 = Text, 2 = Read, 3 = Write */
  kind?: 1 | 2 | 3;
}

export interface ServerCapabilities {
  positionEncoding?: string;
  hoverProvider?: boolean | object;
  completionProvider?: {
    triggerCharacters?: string[];
    resolveProvider?: boolean;
  };
  signatureHelpProvider?: {
    triggerCharacters?: string[];
    retriggerCharacters?: string[];
  };
  definitionProvider?: boolean | object;
  typeDefinitionProvider?: boolean | object;
  implementationProvider?: boolean | object;
  referencesProvider?: boolean | object;
  documentHighlightProvider?: boolean | object;
  documentSymbolProvider?: boolean | object;
  documentFormattingProvider?: boolean | object;
  renameProvider?: boolean | { prepareProvider?: boolean };
  foldingRangeProvider?: boolean | object;
  inlayHintProvider?: boolean | object;
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: { name: string; version?: string };
}
