import {
  toLspPosition,
  toMonacoCompletionItem,
  toMonacoDefinitions,
  toMonacoHover,
  toMonacoMarker,
  toMonacoRange,
  toMonacoSignatureHelp,
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

// The converters need only monaco's enums, sourced from its self-contained
// standalone file — the full `monaco-editor` entry is ESM-only and unresolvable
// in jest. Importing the real enums avoids the values drifting on a monaco bump.
jest.mock(
  "monaco-editor",
  () => {
    const {
      MarkerSeverity,
      MarkerTag,
      CompletionItemKind,
      CompletionItemInsertTextRule,
      CompletionItemTag,
    } = jest.requireActual(
      "monaco-editor/esm/vs/editor/common/standalone/standaloneEnums"
    );
    return {
      MarkerSeverity,
      MarkerTag,
      languages: {
        CompletionItemKind,
        CompletionItemInsertTextRule,
        CompletionItemTag,
      },
    };
  },
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
  it("should convert zero-based LSP ranges to one-based Monaco ranges", () => {
    expect(toMonacoRange(range)).toEqual({
      startLineNumber: 3,
      startColumn: 5,
      endLineNumber: 3,
      endColumn: 11,
    });
  });

  it("should convert one-based Monaco positions to zero-based LSP positions", () => {
    expect(toLspPosition({ lineNumber: 3, column: 5 })).toEqual({
      line: 2,
      character: 4,
    });
  });
});

describe("diagnostics", () => {
  it("should map severity, code, source, tags and related information", () => {
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
    expect(marker.relatedInformation).toEqual([
      expect.objectContaining({ message: "here" }),
    ]);
  });

  it("should default to error severity and drop external related locations", () => {
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

  it("should use insert/replace ranges and mark snippets", () => {
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

  it("should fall back to the word range and label without a text edit", () => {
    const item = toMonacoCompletionItem(
      { label: "signer", kind: lsp.CompletionItemKind.Method },
      fallbackRange
    );

    expect(item.insertText).toBe("signer");
    expect(item.range).toBe(fallbackRange);
    expect(item.kind).toBe(0);
    expect(item.insertTextRules).toBeUndefined();
  });

  it("should keep deprecation tags and documentation", () => {
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
  it("should accept markup content", () => {
    const hover = toMonacoHover({
      contents: { kind: "markdown", value: "```rust\nfn x()\n```" },
      range,
    });

    expect(hover.contents).toEqual([{ value: "```rust\nfn x()\n```" }]);
    expect(hover.range).toEqual(toMonacoRange(range));
  });

  it("should accept legacy marked strings", () => {
    const hover = toMonacoHover({
      contents: ["plain", { language: "rust", value: "fn x()" }],
    });

    expect(hover.contents).toEqual([
      { value: "plain" },
      { value: "```rust\nfn x()\n```" },
    ]);
  });
});

describe("signature help", () => {
  it("should map signatures and default the active indices", () => {
    const help = toMonacoSignatureHelp({
      signatures: [
        {
          label: "fn hello(ctx: Context)",
          documentation: { kind: "markdown", value: "docs" },
          parameters: [{ label: "ctx: Context" }],
        },
      ],
    });

    expect(help.activeSignature).toBe(0);
    expect(help.activeParameter).toBe(0);
    expect(help.signatures[0].label).toBe("fn hello(ctx: Context)");
    expect(help.signatures[0].documentation).toEqual({ value: "docs" });
    expect(help.signatures[0].parameters).toEqual([{ label: "ctx: Context" }]);
  });

  it("should keep explicit active indices and default missing parameters", () => {
    const help = toMonacoSignatureHelp({
      signatures: [{ label: "f()" }],
      activeSignature: 2,
      activeParameter: 3,
    });

    expect(help.activeSignature).toBe(2);
    expect(help.activeParameter).toBe(3);
    expect(help.signatures[0].parameters).toEqual([]);
  });
});

describe("definitions", () => {
  it("should handle locations, location links and filter external files", () => {
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

  it("should accept a single location", () => {
    const defs = toMonacoDefinitions(
      { uri: "file:///ws/src/lib.rs", range },
      toModelUri
    );
    expect(defs).toHaveLength(1);
  });
});

describe("workspace edits", () => {
  it("should flatten `changes` and `documentChanges` into resource edits", () => {
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
