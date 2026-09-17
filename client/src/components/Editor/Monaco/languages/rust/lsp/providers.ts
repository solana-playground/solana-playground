import * as monaco from "monaco-editor";

import * as lsp from "./protocol";
import {
  toLspPosition,
  toMonacoCompletionItem,
  toMonacoDefinitions,
  toMonacoHover,
  toMonacoRange,
  toMonacoSignatureHelp,
  toMonacoWorkspaceEdit,
} from "./convert";
import { ConnectionClosedError } from "./jsonrpc";
import type { JsonRpcConnection } from "./jsonrpc";
import { Workspace } from "./workspace";
import type { Disposable } from "../../../../../../utils";

/**
 * Register Monaco language providers backed by the language server.
 *
 * Requests for models outside the project (e.g. other workspaces' files that
 * happen to be Rust) return nothing.
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

  /**
   * Send a request, swallowing failures: a request racing a closed connection
   * or a server error must not surface as an editor exception.
   */
  const request = async <R>(method: string, params: unknown) => {
    try {
      return await conn.request<R | null>(method, params);
    } catch (e) {
      if (!(e instanceof ConnectionClosedError)) {
        console.warn(`rust-analyzer: ${method} failed:`, e);
      }
      return null;
    }
  };

  const disposables: monaco.IDisposable[] = [];

  if (capabilities.hoverProvider) {
    disposables.push(
      monaco.languages.registerHoverProvider(languageId, {
        provideHover: async (model, pos) => {
          const params = at(model, pos);
          if (!params) return null;
          const hover = await request<lsp.Hover>("textDocument/hover", params);
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
        provideCompletionItems: async (model, pos, context) => {
          const params = at(model, pos);
          if (!params) return null;

          const result = await request<
            lsp.CompletionList | lsp.CompletionItem[]
          >("textDocument/completion", {
            ...params,
            context: {
              triggerKind: context.triggerKind + 1,
              triggerCharacter: context.triggerCharacter,
            },
          });
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
        provideSignatureHelp: async (model, pos) => {
          const params = at(model, pos);
          if (!params) return null;
          const help = await request<lsp.SignatureHelp>(
            "textDocument/signatureHelp",
            params
          );
          if (!help) return null;
          return { value: toMonacoSignatureHelp(help), dispose: () => {} };
        },
      })
    );
  }

  if (capabilities.definitionProvider) {
    disposables.push(
      monaco.languages.registerDefinitionProvider(languageId, {
        provideDefinition: async (model, pos) => {
          const params = at(model, pos);
          if (!params) return null;
          const result = await request<
            lsp.Location | Array<lsp.Location | lsp.LocationLink>
          >("textDocument/definition", params);
          return toMonacoDefinitions(result, workspace.toModelUri);
        },
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

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};
