import * as monaco from "monaco-editor";

import * as lsp from "./protocol";
import { toMonacoMarker } from "./convert";
import { JsonRpcConnection } from "./jsonrpc";
import { registerProviders } from "./providers";
import { Workspace } from "./workspace";
import type { WorkspaceInfo } from "./workspace";
import { importTypes } from "../../common";
import {
  PgCommon,
  PgExplorer,
  PgSettings,
  PgTerminal,
} from "../../../../../../utils";
import type { Disposable } from "../../../../../../utils";

/** Monaco language id for Rust */
const LANGUAGE_ID = "rust";

/** Owner of the markers this client sets */
const MARKER_OWNER = "rust-analyzer-lsp";

/** Route of the language server WebSocket on the playground server */
const ROUTE = "/unstable/lsp";

/** How long to wait for the server to accept the project */
const OPEN_TIMEOUT_MS = 60_000;

/** How long to wait for the server to acknowledge `shutdown` */
const SHUTDOWN_TIMEOUT_MS = 2_000;

/**
 * Delay between the last edit and the save that triggers `cargo check`.
 *
 * The playground autosaves, so "save" means "the user paused typing".
 */
const SAVE_DELAY_MS = 1000;

/**
 * Requests the bridge answers itself instead of forwarding to rust-analyzer.
 *
 * `solpg/open` sends the project files and starts a language server for the
 * matching template; `solpg/sync` writes the files to the server's disk (the
 * language server reads edits from the LSP overlay, `cargo check` reads the
 * disk). Everything else on the socket is forwarded verbatim.
 */
const BRIDGE = { open: "solpg/open", sync: "solpg/sync" };

/** rust-analyzer configuration, sent at initialize and on request */
const SERVER_CONFIG = {
  // The container has no network; every dependency is cached at image build
  cargo: { extraEnv: { CARGO_NET_OFFLINE: "true" } },
  checkOnSave: true,
};

/**
 * Connect to the server-side rust-analyzer and wire it into the editor.
 *
 * Steps:
 * 1. Open the socket and send the project files
 * 2. Wait for the server to start a language server for the project
 * 3. Run the LSP handshake and open every Rust source
 * 4. Register providers and keep documents in sync
 *
 * @throws if the server is unreachable or rejects the project
 * @returns a disposable that shuts the session down
 */
export const connect = async (): Promise<Disposable> => {
  const url = getUrl();
  const { conn, info } = await open(url);

  try {
    return await attach(conn, info);
  } catch (e) {
    conn.dispose();
    throw e;
  }
};

/** Run the LSP handshake and wire the editor to the connection. */
const attach = async (
  conn: JsonRpcConnection,
  info: WorkspaceInfo
): Promise<Disposable> => {
  const workspace = new Workspace(info);

  // Server -> client requests the server expects an answer to
  conn.onRequest("window/workDoneProgress/create", () => null);
  conn.onRequest("client/registerCapability", () => null);
  conn.onRequest("client/unregisterCapability", () => null);
  conn.onRequest<{ items: unknown[] }, unknown[]>(
    "workspace/configuration",
    ({ items }) => items.map(() => SERVER_CONFIG)
  );
  conn.onNotification<{ type: number; message: string }>(
    "window/showMessage",
    ({ message }) => console.info(`rust-analyzer: ${message}`)
  );

  const init = await conn.request<lsp.InitializeResult>("initialize", {
    processId: null,
    rootUri: info.rootUri,
    workspaceFolders: [{ uri: info.rootUri, name: "program" }],
    capabilities: CLIENT_CAPABILITIES,
    initializationOptions: SERVER_CONFIG,
  });
  conn.notify("initialized", {});

  const diagnostics = trackDiagnostics(conn, workspace);
  const documents = syncDocuments(conn, workspace);
  const providers = registerProviders(
    LANGUAGE_ID,
    conn,
    workspace,
    init.capabilities
  );

  const dispose = () => {
    providers.dispose();
    documents.dispose();
    diagnostics.dispose();
    if (conn.closed) return;

    // Be polite, but never keep the session (and its server slot) alive
    // waiting for a wedged server
    PgCommon.timeout(conn.request("shutdown"), SHUTDOWN_TIMEOUT_MS)
      .catch(() => {})
      .finally(() => {
        conn.notify("exit");
        conn.dispose();
      });
  };

  // The server going away is the same as disposing on our side
  conn.onClose(dispose);

  return { dispose };
};

/** Derive the WebSocket URL from the build server setting. */
const getUrl = () => {
  const endpoint = PgSettings.server.endpoint.replace(/^http/, "ws");
  return PgCommon.joinPaths(endpoint, ROUTE);
};

/**
 * Open the socket, send the project and wait for the server to be ready.
 *
 * @throws if the socket cannot connect or the server rejects the project
 */
const open = async (url: string) => {
  const socket = await new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.onopen = () => resolve(socket);
    socket.onerror = () =>
      reject(new Error(`Could not connect to the language server at ${url}`));
  });

  const conn = new JsonRpcConnection(socket);
  try {
    const info = await PgCommon.timeout(
      conn.request<WorkspaceInfo>(BRIDGE.open, { files: Workspace.getFiles() }),
      OPEN_TIMEOUT_MS
    );
    return { conn, info };
  } catch (e) {
    conn.dispose();
    throw new Error(`Language server rejected the project: ${describe(e)}`);
  }
};

/** Get a message out of anything that was thrown or rejected with. */
const describe = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Keep markers in sync with `textDocument/publishDiagnostics`. */
const trackDiagnostics = (
  conn: JsonRpcConnection,
  workspace: Workspace
): Disposable => {
  // Diagnostics for files whose model does not exist yet (not opened in a tab)
  const pending = new Map<string, monaco.editor.IMarkerData[]>();

  const disposables = [
    conn.onNotification<lsp.PublishDiagnosticsParams>(
      "textDocument/publishDiagnostics",
      ({ uri, diagnostics }) => {
        const markers = diagnostics.map((d) =>
          toMonacoMarker(d, workspace.toModelUri)
        );
        const model = workspace.getModel(uri);
        if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
        else pending.set(uri, markers);
      }
    ),
    monaco.editor.onDidCreateModel((model) => {
      if (!Workspace.isProjectSource(model.uri.path)) return;
      const markers = pending.get(workspace.toUri(model.uri.path));
      if (markers) monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
    }),
  ];

  return {
    dispose: () => {
      disposables.forEach(({ dispose }) => dispose());
      pending.clear();
      monaco.editor.removeAllMarkers(MARKER_OWNER);
    },
  };
};

/**
 * Keep the server's view of the project in sync with the explorer.
 *
 * Every Rust source is kept open on the server so edits reach rust-analyzer
 * as overlays. The disk copy the server holds is rewritten (`sync`) before
 * every `didSave`, because `cargo check` reads the disk, and before the
 * `didOpen`/`didClose` of structural changes, so `mod` declarations resolve.
 */
const syncDocuments = (
  conn: JsonRpcConnection,
  workspace: Workspace
): Disposable => {
  /** Open documents (version and last sent text), keyed by explorer path */
  const documents = new Map<string, { version: number; text: string }>();

  const openDocument = (path: string, text: string) => {
    documents.set(path, { version: 1, text });
    conn.notify("textDocument/didOpen", {
      textDocument: {
        uri: workspace.toUri(path),
        languageId: LANGUAGE_ID,
        version: 1,
        text,
      },
    });
  };

  const closeDocument = (path: string) => {
    documents.delete(path);
    conn.notify("textDocument/didClose", {
      textDocument: { uri: workspace.toUri(path) },
    });
  };

  // Syncs are chained so two never race on the server's disk; a failed sync
  // (e.g. a file name the server does not accept) is reported once and does
  // not end the session
  let lastSync: Promise<void> = Promise.resolve();
  const sync = () => {
    lastSync = lastSync
      .then(() => conn.request(BRIDGE.sync, { files: Workspace.getFiles() }))
      .then(
        () => {},
        (e) => {
          if (conn.closed) return;
          PgTerminal.println(
            PgTerminal.warning(`Rust Analyzer: sync failed: ${describe(e)}`)
          );
        }
      );
    return lastSync;
  };

  // rust-analyzer runs `cargo check` (the rustc diagnostics) on save only,
  // and it checks what is on disk
  const saveDocument = PgCommon.debounce(
    async (path: string) => {
      await sync();
      if (!documents.has(path)) return;
      conn.notify("textDocument/didSave", {
        textDocument: { uri: workspace.toUri(path) },
      });
    },
    { delay: SAVE_DELAY_MS }
  );

  const changeDocument = (path: string, text: string) => {
    const document = documents.get(path);
    if (!document) return openDocument(path, text);
    // Model switches re-run the update callback without an actual change
    if (document.text === text) return;

    const version = document.version + 1;
    documents.set(path, { version, text });
    // Full text, not incremental: allowed by LSP whatever sync kind the
    // server announced, and the playground already has the whole model
    conn.notify("textDocument/didChange", {
      textDocument: { uri: workspace.toUri(path), version },
      contentChanges: [{ text }],
    });
    saveDocument(path);
  };

  const getSourcePaths = () =>
    Object.keys(PgExplorer.files).filter(Workspace.isProjectSource);

  const sourcePaths = getSourcePaths();
  for (const path of sourcePaths) {
    openDocument(path, PgExplorer.getFileContent(path) ?? "");
  }
  // rust-analyzer does not check until the first save; the project as opened
  // deserves its compiler diagnostics too
  if (sourcePaths.length) saveDocument(sourcePaths[0]);

  // Structural changes: mirror the tree, then diff the set of open sources
  const { dispose: disposeStructure } = PgCommon.batchChanges(async () => {
    await sync();
    if (conn.closed) return;

    const current = new Set(getSourcePaths());
    for (const path of documents.keys()) {
      if (!current.has(path)) closeDocument(path);
    }
    for (const path of current) {
      if (!documents.has(path)) {
        openDocument(path, PgExplorer.getFileContent(path) ?? "");
      }
    }
  }, [
    PgExplorer.onDidCreateItem,
    PgExplorer.onDidRenameItem,
    PgExplorer.onDidDeleteItem,
  ]);

  // Content changes of the model in the editor
  const disposeContent = importTypes((model) => {
    const path = model.uri.path;
    if (Workspace.isProjectSource(path)) changeDocument(path, model.getValue());
  }, LANGUAGE_ID);

  return {
    dispose: () => {
      disposeStructure();
      disposeContent.then(({ dispose }) => dispose());
      documents.clear();
    },
  };
};

/** What this client can display */
const CLIENT_CAPABILITIES = {
  general: { positionEncodings: ["utf-16"] },
  window: { workDoneProgress: true },
  workspace: { configuration: true, workspaceEdit: { documentChanges: true } },
  textDocument: {
    synchronization: { didSave: true },
    publishDiagnostics: {
      relatedInformation: true,
      tagSupport: { valueSet: [1, 2] },
    },
    hover: { contentFormat: ["markdown", "plaintext"] },
    completion: {
      completionItem: {
        snippetSupport: true,
        documentationFormat: ["markdown", "plaintext"],
        deprecatedSupport: true,
        preselectSupport: true,
        insertReplaceSupport: true,
        labelDetailsSupport: true,
        resolveSupport: {
          properties: ["documentation", "detail", "additionalTextEdits"],
        },
      },
      contextSupport: true,
    },
    signatureHelp: {
      signatureInformation: {
        documentationFormat: ["markdown", "plaintext"],
        parameterInformation: { labelOffsetSupport: true },
        activeParameterSupport: true,
      },
    },
    definition: { linkSupport: true },
    typeDefinition: { linkSupport: true },
    implementation: { linkSupport: true },
    references: {},
    documentHighlight: {},
    documentSymbol: { hierarchicalDocumentSymbolSupport: true },
    rename: { prepareSupport: true },
    foldingRange: { lineFoldingOnly: true },
    inlayHint: { resolveSupport: { properties: [] } },
    formatting: {},
  },
};
