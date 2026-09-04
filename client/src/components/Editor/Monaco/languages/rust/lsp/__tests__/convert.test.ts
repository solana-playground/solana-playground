import {
  toLspPosition,
  toMonacoCompletionItem,
  toMonacoDefinitions,
  toMonacoDocumentSymbol,
  toMonacoFoldingRange,
  toMonacoHover,
  toMonacoInlayHint,
  toMonacoMarker,
  toMonacoRange,
  toMonacoWorkspaceEdit,
} from "../convert";
import * as lsp from "../protocol";

// Importing `utils` drags the whole browser runtime in; only two helpers are
// used.
jest.mock("../../../../../../../utils", () => ({
  PgCommon: {
    toArray: <T>(v: T | T[]) => (Array.isArray(v) ? v : [v]),
    isNonNullish: <T>(v: T) => v !== null && v !== undefined,
  },
}));

// Monaco enums used by the converters, with their real values. The editor
// package is ESM-only (no `main`), so jest cannot even resolve it: `virtual`.
jest.mock(
  "monaco-editor",
  () => ({
    MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 },
    MarkerTag: { Unnecessary: 1, Deprecated: 2 },
    languages: {
      CompletionItemKind: {
        Method: 0,
        Function: 1,
        Constructor: 2,
        Field: 3,
        Variable: 4,
        Class: 5,
        Struct: 6,
        Interface: 7,
        Module: 8,
        Property: 9,
        Event: 10,
        Operator: 11,
        Unit: 12,
        Value: 13,
        Constant: 14,
        Enum: 15,
        EnumMember: 16,
        Keyword: 17,
        Text: 18,
        Color: 19,
        File: 20,
        Reference: 21,
        Folder: 23,
        TypeParameter: 24,
        Snippet: 27,
      },
      CompletionItemInsertTextRule: { KeepWhitespace: 1, InsertAsSnippet: 4 },
      CompletionItemTag: { Deprecated: 1 },
      InlayHintKind: { Type: 1, Parameter: 2 },
      FoldingRangeKind: {
        Comment: { value: "comment" },
        Imports: { value: "imports" },
        Region: { value: "region" },
      },
    },
  }),
  { virtual: true }
);

const range: lsp.Range = {
  start: { line: 2, character: 4 },
  end: { line: 2, character: 10 },
};

/** URI mapper stub: everything under `/ws` is ours, the rest is external. */
const toModelUri = (uri: string) =>
  uri.startsWith("file:///ws/")
    ? ({ path: uri.slice("file://".length) } as any)
    : null;

describe("positions and ranges", () => {
  it("converts zero-based LSP ranges to one-based Monaco ranges", () => {
    expect(toMonacoRange(range)).toEqual({
      startLineNumber: 3,
      startColumn: 5,
      endLineNumber: 3,
      endColumn: 11,
    });
  });

  it("converts one-based Monaco positions to zero-based LSP positions", () => {
    expect(toLspPosition({ lineNumber: 3, column: 5 })).toEqual({
      line: 2,
      character: 4,
    });
  });
});

describe("diagnostics", () => {
  it("maps severity, code, source, tags and related information", () => {
    const marker = toMonacoMarker(
      {
        range,
        severity: lsp.DiagnosticSeverity.Warning,
        code: "E0308",
        source: "rustc",
        message: "mismatched types",
        tags: [lsp.DiagnosticTag.Unnecessary],
        relatedInformation: [
          {
            location: { uri: "file:///ws/src/lib.rs", range },
            message: "here",
          },
        ],
      },
      toModelUri
    );

    expect(marker.severity).toBe(4);
    expect(marker.code).toBe("E0308");
    expect(marker.source).toBe("rustc");
    expect(marker.message).toBe("mismatched types");
    expect(marker.tags).toEqual([1]);
    expect(marker.relatedInformation).toHaveLength(1);
    expect(marker.relatedInformation![0].message).toBe("here");
  });

  it("defaults to error severity and drops external related locations", () => {
    const marker = toMonacoMarker(
      {
        range,
        message: "boom",
        relatedInformation: [
          { location: { uri: "file:///registry/x.rs", range }, message: "x" },
        ],
      },
      toModelUri
    );

    expect(marker.severity).toBe(8);
    expect(marker.relatedInformation).toEqual([]);
  });
});

describe("completion items", () => {
  const fallbackRange = {
    startLineNumber: 3,
    startColumn: 1,
    endLineNumber: 3,
    endColumn: 5,
  };

  it("uses insert/replace ranges and marks snippets", () => {
    const item = toMonacoCompletionItem(
      {
        label: "my_account",
        kind: lsp.CompletionItemKind.Field,
        labelDetails: { detail: "", description: "Account<MyAccount>" },
        insertTextFormat: lsp.InsertTextFormat.Snippet,
        textEdit: {
          newText: "my_account$0",
          insert: range,
          replace: { start: range.start, end: { line: 2, character: 14 } },
        },
        additionalTextEdits: [{ range, newText: "use x::Y;\n" }],
      },
      fallbackRange
    );

    expect(item.kind).toBe(3);
    expect(item.insertText).toBe("my_account$0");
    expect(item.insertTextRules).toBe(4);
    expect(item.range).toEqual({
      insert: toMonacoRange(range),
      replace: {
        startLineNumber: 3,
        startColumn: 5,
        endLineNumber: 3,
        endColumn: 15,
      },
    });
    expect(item.detail).toBe("Account<MyAccount>");
    expect(item.additionalTextEdits).toEqual([
      { range: toMonacoRange(range), text: "use x::Y;\n" },
    ]);
  });

  it("falls back to the word range and label without a text edit", () => {
    const item = toMonacoCompletionItem(
      { label: "signer", kind: lsp.CompletionItemKind.Method },
      fallbackRange
    );

    expect(item.insertText).toBe("signer");
    expect(item.range).toBe(fallbackRange);
    expect(item.kind).toBe(0);
    expect(item.insertTextRules).toBeUndefined();
  });

  it("keeps deprecation tags and documentation", () => {
    const item = toMonacoCompletionItem(
      {
        label: "old",
        tags: [lsp.CompletionItemTag.Deprecated],
        documentation: { kind: "markdown", value: "**gone**" },
      },
      fallbackRange
    );

    expect(item.tags).toEqual([1]);
    expect(item.documentation).toEqual({ value: "**gone**" });
  });
});

describe("hover", () => {
  it("accepts markup content", () => {
    const hover = toMonacoHover({
      contents: { kind: "markdown", value: "```rust\nfn x()\n```" },
      range,
    });

    expect(hover.contents).toEqual([{ value: "```rust\nfn x()\n```" }]);
    expect(hover.range).toEqual(toMonacoRange(range));
  });

  it("accepts legacy marked strings", () => {
    const hover = toMonacoHover({
      contents: ["plain", { language: "rust", value: "fn x()" }],
    });

    expect(hover.contents).toEqual([
      { value: "plain" },
      { value: "```rust\nfn x()\n```" },
    ]);
  });
});

describe("definitions", () => {
  it("handles locations, location links and filters external files", () => {
    const defs = toMonacoDefinitions(
      [
        { uri: "file:///ws/src/lib.rs", range },
        {
          targetUri: "file:///ws/src/state.rs",
          targetRange: range,
          targetSelectionRange: range,
        },
        { uri: "file:///registry/anchor/lib.rs", range },
      ],
      toModelUri
    );

    expect(defs.map((d) => d.uri.path)).toEqual([
      "/ws/src/lib.rs",
      "/ws/src/state.rs",
    ]);
  });

  it("accepts a single location", () => {
    const defs = toMonacoDefinitions(
      { uri: "file:///ws/src/lib.rs", range },
      toModelUri
    );
    expect(defs).toHaveLength(1);
  });
});

describe("workspace edits", () => {
  it("flattens `changes` and `documentChanges` into resource edits", () => {
    const edit = toMonacoWorkspaceEdit(
      {
        changes: { "file:///ws/src/lib.rs": [{ range, newText: "a" }] },
        documentChanges: [
          {
            textDocument: { uri: "file:///ws/src/state.rs", version: 3 },
            edits: [{ range, newText: "b" }],
          },
          { kind: "create" },
          {
            textDocument: { uri: "file:///registry/x.rs", version: 1 },
            edits: [{ range, newText: "c" }],
          },
        ],
      },
      toModelUri
    );

    expect(edit.edits).toHaveLength(2);
    expect((edit.edits[1] as any).textEdit.text).toBe("b");
    expect((edit.edits[1] as any).versionId).toBe(3);
  });
});

describe("symbols, hints and folding", () => {
  it("shifts symbol kinds to Monaco's zero-based enum", () => {
    const symbol = toMonacoDocumentSymbol({
      name: "MyAccount",
      kind: lsp.SymbolKind.Struct,
      range,
      selectionRange: range,
      children: [
        {
          name: "data",
          kind: lsp.SymbolKind.Field,
          range,
          selectionRange: range,
        },
      ],
    });

    expect(symbol.kind).toBe(22);
    expect(symbol.children![0].kind).toBe(7);
    expect(symbol.detail).toBe("");
  });

  it("converts inlay hints with label parts", () => {
    const hint = toMonacoInlayHint({
      position: { line: 0, character: 3 },
      label: [{ value: ": " }, { value: "u64" }],
      kind: lsp.InlayHintKind.Type,
      paddingLeft: true,
    });

    expect(hint.position).toEqual({ lineNumber: 1, column: 4 });
    expect(hint.label).toEqual([{ label: ": " }, { label: "u64" }]);
    expect(hint.kind).toBe(1);
    expect(hint.paddingLeft).toBe(true);
  });

  it("converts folding ranges", () => {
    expect(
      toMonacoFoldingRange({ startLine: 1, endLine: 4, kind: "imports" })
    ).toEqual({ start: 2, end: 5, kind: { value: "imports" } });
  });
});
