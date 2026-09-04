import * as monaco from "monaco-editor";

import * as lsp from "./protocol";
import {
  toLspPosition,
  toLspRange,
  toMonacoCompletionItem,
  toMonacoDefinitions,
  toMonacoDocumentHighlight,
  toMonacoDocumentSymbol,
  toMonacoFoldingRange,
  toMonacoHover,
  toMonacoInlayHint,
  toMonacoRange,
  toMonacoSignatureHelp,
  toMonacoTextEdit,
  toMonacoWorkspaceEdit,
} from "./convert";
import type { CancellationToken, JsonRpcConnection } from "./jsonrpc";
import { Workspace } from "./workspace";
import type { Disposable } from "../../../../../../utils";

/**
 * Register Monaco language providers backed by the language server.
 *
 * Requests for models outside the project (e.g. other workspaces' files that
 * happen to be Rust) return nothing.
 *
 * @param languageId Monaco language id
 * @param conn JSON-RPC connection to the server
 * @param workspace path mapping
 * @param capabilities capabilities the server announced
 * @returns a disposable to remove all providers
 */
export const registerProviders = (
  languageId: string,
  conn: JsonRpcConnection,
  workspace: Workspace,
  capabilities: lsp.ServerCapabilities
): Disposable => {
  /** Text document + position params for a model, or `null` if not ours */
  const at = (model: monaco.editor.ITextModel, pos: monaco.IPosition) => {
    if (!Workspace.isProjectSource(model.uri.path)) return null;
    return {
      textDocument: { uri: workspace.toUri(model.uri.path) },
      position: toLspPosition(pos),
    };
  };
  const doc = (model: monaco.editor.ITextModel) => {
    if (!Workspace.isProjectSource(model.uri.path)) return null;
    return { textDocument: { uri: workspace.toUri(model.uri.path) } };
  };

  /**
   * Send a request, swallowing failures: a request racing a closed connection,
   * a cancelled one or a server error must not surface as an editor exception.
   */
  const request = async <R>(
    method: string,
    params: unknown,
    token?: CancellationToken
  ) => {
    try {
      return await conn.request<R | null>(method, params, token);
    } catch (e) {
      if (!token?.isCancellationRequested) {
        console.warn(`rust-analyzer: ${method} failed:`, e);
      }
      return null;
    }
  };

  const disposables: monaco.IDisposable[] = [];

  if (capabilities.hoverProvider) {
    disposables.push(
      monaco.languages.registerHoverProvider(languageId, {
        provideHover: async (model, pos, token) => {
          const params = at(model, pos);
          if (!params) return null;
          const hover = await request<lsp.Hover>(
            "textDocument/hover",
            params,
            token
          );
          return hover ? toMonacoHover(hover) : null;
        },
      })
    );
  }

  if (capabilities.completionProvider) {
    const { triggerCharacters, resolveProvider } =
      capabilities.completionProvider;
    disposables.push(
      monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters,
        provideCompletionItems: async (model, pos, context, token) => {
          const params = at(model, pos);
          if (!params) return null;

          const result = await request<
            lsp.CompletionList | lsp.CompletionItem[]
          >(
            "textDocument/completion",
            {
              ...params,
              context: {
                triggerKind: context.triggerKind + 1,
                triggerCharacter: context.triggerCharacter,
              },
            },
            token
          );
          if (!result) return null;

          const items = Array.isArray(result) ? result : result.items;
          const word = model.getWordUntilPosition(pos);
          const fallbackRange: monaco.IRange = {
            startLineNumber: pos.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: pos.lineNumber,
            endColumn: word.endColumn,
          };

          return {
            suggestions: items.map((item) => ({
              ...toMonacoCompletionItem(item, fallbackRange),
              // Stashed for `resolveCompletionItem`
              lspItem: item,
            })),
            incomplete: Array.isArray(result) ? false : result.isIncomplete,
          };
        },
        resolveCompletionItem: resolveProvider
          ? async (item) => {
              const lspItem = (item as { lspItem?: lsp.CompletionItem })
                .lspItem;
              if (!lspItem) return item;

              const resolved = await request<lsp.CompletionItem>(
                "completionItem/resolve",
                lspItem
              );
              if (!resolved) return item;

              // Resolve only fills in the expensive fields; keep the range
              const converted = toMonacoCompletionItem(resolved, item.range);
              return {
                ...item,
                detail: converted.detail,
                documentation: converted.documentation,
                additionalTextEdits:
                  converted.additionalTextEdits ?? item.additionalTextEdits,
              };
            }
          : undefined,
      })
    );
  }

  if (capabilities.signatureHelpProvider) {
    const { triggerCharacters, retriggerCharacters } =
      capabilities.signatureHelpProvider;
    disposables.push(
      monaco.languages.registerSignatureHelpProvider(languageId, {
        signatureHelpTriggerCharacters: triggerCharacters,
        signatureHelpRetriggerCharacters: retriggerCharacters,
        provideSignatureHelp: async (model, pos, token) => {
          const params = at(model, pos);
          if (!params) return null;
          const help = await request<lsp.SignatureHelp>(
            "textDocument/signatureHelp",
            params,
            token
          );
          if (!help) return null;
          return { value: toMonacoSignatureHelp(help), dispose: () => {} };
        },
      })
    );
  }

  /** Shared implementation of the goto-* providers */
  const provideLocations =
    (method: string) =>
    async (
      model: monaco.editor.ITextModel,
      pos: monaco.IPosition,
      token: CancellationToken
    ) => {
      const params = at(model, pos);
      if (!params) return null;
      const result = await request<
        lsp.Location | Array<lsp.Location | lsp.LocationLink>
      >(method, params, token);
      return toMonacoDefinitions(result, workspace.toModelUri);
    };

  if (capabilities.definitionProvider) {
    disposables.push(
      monaco.languages.registerDefinitionProvider(languageId, {
        provideDefinition: provideLocations("textDocument/definition"),
      })
    );
  }

  if (capabilities.typeDefinitionProvider) {
    disposables.push(
      monaco.languages.registerTypeDefinitionProvider(languageId, {
        provideTypeDefinition: provideLocations("textDocument/typeDefinition"),
      })
    );
  }

  if (capabilities.implementationProvider) {
    disposables.push(
      monaco.languages.registerImplementationProvider(languageId, {
        provideImplementation: provideLocations("textDocument/implementation"),
      })
    );
  }

  if (capabilities.referencesProvider) {
    disposables.push(
      monaco.languages.registerReferenceProvider(languageId, {
        provideReferences: async (model, pos, context) => {
          const params = at(model, pos);
          if (!params) return null;
          const result = await request<lsp.Location[]>(
            "textDocument/references",
            { ...params, context }
          );
          return toMonacoDefinitions(result, workspace.toModelUri);
        },
      })
    );
  }

  if (capabilities.documentHighlightProvider) {
    disposables.push(
      monaco.languages.registerDocumentHighlightProvider(languageId, {
        provideDocumentHighlights: async (model, pos) => {
          const params = at(model, pos);
          if (!params) return null;
          const result = await request<lsp.DocumentHighlight[]>(
            "textDocument/documentHighlight",
            params
          );
          return result?.map(toMonacoDocumentHighlight) ?? null;
        },
      })
    );
  }

  if (capabilities.renameProvider) {
    const prepareProvider =
      typeof capabilities.renameProvider === "object" &&
      capabilities.renameProvider.prepareProvider;
    disposables.push(
      monaco.languages.registerRenameProvider(languageId, {
        provideRenameEdits: async (model, pos, newName) => {
          const params = at(model, pos);
          if (!params) return null;
          const edit = await request<lsp.WorkspaceEdit>("textDocument/rename", {
            ...params,
            newName,
          });
          return edit
            ? toMonacoWorkspaceEdit(edit, workspace.toModelUri)
            : null;
        },
        resolveRenameLocation: prepareProvider
          ? async (model, pos) => {
              const params = at(model, pos);
              if (!params) return null;
              const result = await request<lsp.PrepareRenameResult>(
                "textDocument/prepareRename",
                params
              );
              if (!result || "defaultBehavior" in result) return null;

              const range = "placeholder" in result ? result.range : result;
              const text =
                "placeholder" in result
                  ? result.placeholder
                  : model.getValueInRange(toMonacoRange(range));
              return { range: toMonacoRange(range), text };
            }
          : undefined,
      })
    );
  }

  if (capabilities.documentSymbolProvider) {
    disposables.push(
      monaco.languages.registerDocumentSymbolProvider(languageId, {
        provideDocumentSymbols: async (model) => {
          const params = doc(model);
          if (!params) return null;
          const result = await request<lsp.DocumentSymbol[]>(
            "textDocument/documentSymbol",
            params
          );
          // Flat `SymbolInformation[]` (no `selectionRange`) is not supported
          if (!result?.every((symbol) => "selectionRange" in symbol)) {
            return null;
          }
          return result.map(toMonacoDocumentSymbol);
        },
      })
    );
  }

  if (capabilities.foldingRangeProvider) {
    disposables.push(
      monaco.languages.registerFoldingRangeProvider(languageId, {
        provideFoldingRanges: async (model) => {
          const params = doc(model);
          if (!params) return null;
          const result = await request<lsp.FoldingRange[]>(
            "textDocument/foldingRange",
            params
          );
          return result?.map(toMonacoFoldingRange) ?? null;
        },
      })
    );
  }

  if (capabilities.inlayHintProvider) {
    disposables.push(
      monaco.languages.registerInlayHintsProvider(languageId, {
        provideInlayHints: async (model, range, token) => {
          const params = doc(model);
          if (!params) return null;
          const result = await request<lsp.InlayHint[]>(
            "textDocument/inlayHint",
            { ...params, range: toLspRange(range) },
            token
          );
          return {
            hints: result?.map(toMonacoInlayHint) ?? [],
            dispose: () => {},
          };
        },
      })
    );
  }

  if (capabilities.documentFormattingProvider) {
    disposables.push(
      monaco.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits: async (model, options) => {
          const params = doc(model);
          if (!params) return null;
          const result = await request<lsp.TextEdit[]>(
            "textDocument/formatting",
            {
              ...params,
              options: {
                tabSize: options.tabSize,
                insertSpaces: options.insertSpaces,
              },
            }
          );
          return result?.map(toMonacoTextEdit) ?? null;
        },
      })
    );
  }

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};
