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
  referencesProvider?: boolean | object;
  renameProvider?: boolean | { prepareProvider?: boolean };
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: { name: string; version?: string };
}
