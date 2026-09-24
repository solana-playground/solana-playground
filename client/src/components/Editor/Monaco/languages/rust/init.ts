import {
  connect as connectRustAnalyzerServer,
  setRestartHandler,
  setStatus,
} from "./lsp";
import { initRustAnalyzer } from "./rust-analyzer";
import { PgExplorer, PgSettings, PgTerminal } from "../../../../../utils";
import type { Disposable } from "../../../../../utils";

/**
 * Initialize Rust language support with the backend the user selected: the
 * WASM rust-analyzer (default) or the server-side one, which runs on the
 * build template's toolchain and so reports real `cargo check` errors.
 *
 * Switching the setting tears down the active backend and starts the other.
 * The server backend also restarts on workspace switch: one project per session.
 */
export const init = () => {
  let active: Disposable | undefined;
  let generation = 0;

  const start = async (backend: typeof PgSettings.editor.rustAnalyzer) => {
    const current = ++generation;
    active?.dispose();
    active = undefined;
    setStatus(backend === "server" ? "connecting" : "off");

    try {
      const disposable =
        backend === "server"
          ? await connectRustAnalyzerServer()
          : await initRustAnalyzer();

      // The setting changed again while this backend was starting
      if (current !== generation) disposable.dispose();
      else {
        active = disposable;
        if (backend === "server") setStatus("connected");
      }
    } catch (e) {
      if (backend === "server" && current === generation) {
        setStatus("disconnected");
      }
      const message = e instanceof Error ? e.message : String(e);
      PgTerminal.println(
        PgTerminal.error(`Rust Analyzer (${backend}): ${message}`)
      );
    }
  };

  setRestartHandler(() => start(PgSettings.editor.rustAnalyzer));

  // Setting change events fire once on subscription with the current value
  PgSettings.onDidChangeEditorRustAnalyzer(start);
  PgExplorer.onDidSwitchWorkspace(() => {
    const backend = PgSettings.editor.rustAnalyzer;
    if (backend === "server") start(backend);
  });
};
