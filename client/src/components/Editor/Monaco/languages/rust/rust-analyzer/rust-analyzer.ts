// @ts-nocheck
import * as monaco from "monaco-editor";
import type { WorldState } from "@solana-playground/rust-analyzer";

import { importTypes } from "../../common";
import {
  AsyncMethods,
  Disposable,
  PgCommon,
  PgExplorer,
} from "../../../../../../utils/pg";

/** Monaco language id for Rust */
const LANGUAGE_ID = "rust";

/**
 * Cached crate names for Rust Analyzer.
 *
 * - `full`: Crate has been fully loaded.
 * - `empty`: Crate has been loaded with no content to give intellisense for the crate name.
 * Full crate will be loaded when `crate_name::*` is used in the model content.
 */
const cachedNames: Map<string, "full" | "empty"> = new Map();

/** Rust Analyzer world state */
let state: AsyncMethods<WorldState>;

/**
 * Initialize Rust Analyzer WASM.
 *
 * Steps:
 * 1. Create a worker thread
 * 2. Initialize Rust Analyzer with default crates
 * 3. Load the current workspace in Rust Analyzer
 * 4. Load the necessary crates and set diagnostics
 *
 * @returns a disposable to dispose all events
 */
export const initRustAnalyzer = async (): Promise<Disposable> => {
  // Creating thread pool with `wasm-bindgen-rayon` sometimes hangs forever for
  // unknown reasons. Retry until success in order to mitigate this problem.
  // The try interval should take into account the initial download time of the
  // Rust Analyzer WASM files(~9MB) on slower connections.
  state = await PgCommon.tryUntilSuccess(createWorker, 10000);

  // Initialize and load the default crates
  await state.loadDefaultCrates(
    ...(await Promise.all([
      PgCommon.fetchText("/crates/core.rs"),
      PgCommon.fetchText("/crates/alloc.rs"),
      PgCommon.fetchText("/crates/std.rs"),
    ]))
  );

  const { dispose: disposeUpdateCurrentCrate } = await PgCommon.executeInitial(
    (cb) => {
      // Both `onDidInit` and `onDidSwitchWorkspace` is required to catch all
      // cases in which the current crate needs to be updated
      return PgCommon.batchChanges(cb, [
        PgExplorer.onDidInit,
        PgExplorer.onDidSwitchWorkspace,
      ]);
    },
    async () => {
      // Return early if `lib.rs` file doesn't exist
      const file = PgExplorer.getFile("src/lib.rs");
      if (!file) return;

      // Load crate
      await state.setLocalCrateName(
        PgCommon.toSnakeCase(PgExplorer.currentWorkspaceName ?? "solpg")
      );

      // Load files
      await loadLocalFiles();

      // Update model
      const model = monaco.editor.getEditors()[0]?.getModel();
      if (model) await update(model);
    }
  );

  // Update local files when necessary
  const { dispose: disposeLoadLocalFiles } = PgCommon.batchChanges(
    loadLocalFiles,
    [
      PgExplorer.onDidCreateItem,
      PgExplorer.onDidDeleteItem,
      PgExplorer.onDidRenameItem,
    ]
  );

  // Import crates when necessary
  const { dispose: disposeImportTypes } = await importTypes(
    update,
    LANGUAGE_ID
  );

  // Register providers at the end in order to avoid out of bound errors due to
  // a possible mismatch between the LSP and the client files before initialization
  const { dispose: disposeProviders } = registerProviders();

  return {
    dispose: () => {
      disposeUpdateCurrentCrate();
      disposeLoadLocalFiles();
      disposeImportTypes();
      disposeProviders();
    },
  };
};

/** Create Rust Analyzer web worker. */
const createWorker = () => {
  const worker = new Worker(new URL("./worker.ts", import.meta.url));

  const pendingResolve = {};
  let id = 1;

  const callWorker = async (method, ...args) => {
    return new Promise((res) => {
      pendingResolve[id] = res;
      worker.postMessage({ method, args, id });
      id += 1;
    });
  };

  const proxyHandler = {
    get: (target, prop, receiver) => {
      if (prop === "then") return Reflect.get(target, prop, receiver);
      return async (...args) => callWorker(prop, ...args);
    },
  };

  let resolve;
  worker.onmessage = (ev) => {
    if (ev.data.id === "ra-worker-ready") {
      resolve(new Proxy({}, proxyHandler));
      return;
    }

    const pending = pendingResolve[ev.data.id];
    if (pending) {
      pending(ev.data.result);
      delete pendingResolve[ev.data.id];
    }
  };

  return new Promise((res) => {
    resolve = res;
  });
};

/** Load all local Rust files in the workspace. */
const loadLocalFiles = async () => {
  const files = Object.keys(PgExplorer.files)
    .filter((path) => path.endsWith(".rs"))
    .map((path) => [path, PgExplorer.getFileContent(path)]);
  await state.loadLocalFiles(files);
};

/**
 * Jobs:
 * - Load crates when necessary based on the model content
 * - Set model markers for diagnostics
 *
 * @param model monaco editor model
 */
const update = async (model: monaco.editor.IModel) => {
  const crateImportPromises = CRATES.importable
    .map((crate) => {
      const status = cachedNames.get(crate);
      if (status === "full") return null;

      if (new RegExp(`${crate}::`, "gm").test(model.getValue())) {
        return loadDependency(crate);
      } else if (status !== "empty") {
        return loadDependency(crate, { empty: true });
      } else {
        return null;
      }
    })
    .filter(PgCommon.isNonNullish);
  if (crateImportPromises.length) {
    await Promise.all(crateImportPromises);
  }

  const { diagnostics } = await state.update(model.uri.path, model.getValue());
  monaco.editor.setModelMarkers(model, LANGUAGE_ID, diagnostics);
};

/**
 * Load crate and its dependencies(if any) recursively.
 *
 * @param name crate name(snake_case)
 * @param opts load options
 * - `empty`: Load the dependency with no content
 * - `transitive`: Load the dependency as transitive
 */
const loadDependency = async (
  name: string,
  opts?: { empty?: boolean; transitive?: boolean }
) => {
  // Check if the crate is already loaded
  if (cachedNames.get(name) === "full") return;

  // Load empty crate
  if (opts?.empty) {
    await state.loadDependency(name);
    cachedNames.set(name, "empty");
    return;
  }

  // Load full crate
  const [code, manifest] = await Promise.all([
    PgCommon.fetchText(`/crates/${name}.rs`),
    PgCommon.fetchText(`/crates/${name}.toml`),
  ]);

  const neededCrates: string[] = await state.loadDependency(
    name,
    code,
    manifest,
    !!opts?.transitive
  );
  cachedNames.set(name, "full");

  const crateImportPromises = neededCrates
    .map((crate) => {
      if (CRATES.importable.includes(crate)) {
        return loadDependency(crate);
      } else if (CRATES.transitive.includes(crate)) {
        return loadDependency(crate, { transitive: true });
      } else {
        return null;
      }
    })
    .filter(PgCommon.isNonNullish);
  if (crateImportPromises.length) {
    await Promise.all(crateImportPromises);
  }
};

/**
 * Register editor providers.
 *
 * @returns a disposable to remove all registered providers
 */
const registerProviders = (): Disposable => {
  const disposables = [
    monaco.languages.registerHoverProvider(LANGUAGE_ID, {
      provideHover: async (_, pos) => {
        return await state.hover(pos.lineNumber, pos.column);
      },
    }),

    monaco.languages.registerCodeLensProvider(LANGUAGE_ID, {
      provideCodeLenses: async (model) => {
        const codeLenses = await state.codeLenses();
        return {
          lenses: codeLenses.map(({ range, command }) => {
            const position = {
              column: range.startColumn,
              lineNumber: range.startLineNumber,
            };

            const references = command.positions.map((pos) => ({
              range: pos,
              uri: model.uri,
            }));
            return {
              range,
              command: {
                id: command.id,
                title: command.title,
                arguments: [model.uri, position, references],
              },
            };
          }),
          dispose: () => {},
        };
      },
    }),

    monaco.languages.registerReferenceProvider(LANGUAGE_ID, {
      provideReferences: async (model, pos, { includeDeclaration }) => {
        const references = await state.references(
          pos.lineNumber,
          pos.column,
          includeDeclaration
        );
        if (references) {
          return references.map(({ range }) => ({ uri: model.uri, range }));
        }
      },
    }),

    monaco.languages.registerInlayHintsProvider(LANGUAGE_ID, {
      provideInlayHints: async () => {
        const hints = await state.inlayHints();
        return {
          hints: hints.map((hint) => {
            switch (hint.hintType) {
              case 1:
                return {
                  kind: monaco.languages.InlayHintKind.Type,
                  position: {
                    column: hint.range.endColumn,
                    lineNumber: hint.range.endLineNumber,
                  },
                  label: `: ${hint.label}`,
                };

              case 2:
                return {
                  kind: monaco.languages.InlayHintKind.Parameter,
                  position: {
                    column: hint.range.startColumn,
                    lineNumber: hint.range.startLineNumber,
                  },
                  label: `${hint.label}: `,
                  paddingRight: true,
                };

              default:
                throw new Error("Unknown hint type:", hint.hintType);
            }
          }),
          dispose: () => {},
        };
      },
    }),

    monaco.languages.registerDocumentHighlightProvider(LANGUAGE_ID, {
      provideDocumentHighlights: async (_, pos) => {
        return await state.references(pos.lineNumber, pos.column, true);
      },
    }),

    monaco.languages.registerRenameProvider(LANGUAGE_ID, {
      provideRenameEdits: async (model, pos, newName) => {
        const edits = await state.rename(pos.lineNumber, pos.column, newName);
        if (edits) {
          return {
            edits: edits.map((edit) => ({
              resource: model.uri,
              textEdit: edit,
            })),
          };
        }
      },
      resolveRenameLocation: async (_, pos) => {
        return state.prepareRename(pos.lineNumber, pos.column);
      },
    }),

    monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
      triggerCharacters: [".", ":", "="],
      provideCompletionItems: async (_, pos) => {
        const suggestions = await state.completions(pos.lineNumber, pos.column);
        if (suggestions) return { suggestions };
      },
    }),

    monaco.languages.registerSignatureHelpProvider(LANGUAGE_ID, {
      signatureHelpTriggerCharacters: ["(", ","],
      provideSignatureHelp: async (_, pos) => {
        const value = await state.signatureHelp(pos.lineNumber, pos.column);
        if (value) return { value, dispose: () => {} };
      },
    }),

    monaco.languages.registerDefinitionProvider(LANGUAGE_ID, {
      provideDefinition: async (model, pos) => {
        const list = await state.definition(pos.lineNumber, pos.column);
        if (list) return list.map((def) => ({ ...def, uri: model.uri }));
      },
    }),

    monaco.languages.registerTypeDefinitionProvider(LANGUAGE_ID, {
      provideTypeDefinition: async (model, pos) => {
        const list = await state.typeDefinition(pos.lineNumber, pos.column);
        if (list) return list.map((def) => ({ ...def, uri: model.uri }));
      },
    }),

    monaco.languages.registerImplementationProvider(LANGUAGE_ID, {
      provideImplementation: async (model, pos) => {
        const list = await state.goToImplementation(pos.lineNumber, pos.column);
        if (list) return list.map((def) => ({ ...def, uri: model.uri }));
      },
    }),

    monaco.languages.registerDocumentSymbolProvider(LANGUAGE_ID, {
      provideDocumentSymbols: async () => {
        return await state.documentSymbols();
      },
    }),

    monaco.languages.registerOnTypeFormattingEditProvider(LANGUAGE_ID, {
      autoFormatTriggerCharacters: [".", "="],
      provideOnTypeFormattingEdits: async (_, pos, ch) => {
        return await state.typeFormatting(pos.lineNumber, pos.column, ch);
      },
    }),

    monaco.languages.registerFoldingRangeProvider(LANGUAGE_ID, {
      provideFoldingRanges: async () => {
        return await state.foldingRanges();
      },
    }),
  ];

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};
