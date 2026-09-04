import { connect as connectRustAnalyzerServer } from "./lsp";
import { initRustAnalyzer } from "./rust-analyzer";
import { PgExplorer, PgSettings, PgTerminal } from "../../../../../utils";
import type { Disposable } from "../../../../../utils";

/**
 * Initialize Rust language support with the backend the user selected.
 *
 * Two backends, both rust-analyzer:
 * - `wasm`: compiled to WASM, runs in a worker with a fixed set of crates
 *   (the default; also provides code lenses and on-type formatting)
 * - `server`: runs on the build server with the template's toolchain, so it
 *   knows the crate versions the build uses and reports `cargo check` errors
 *
 * Switching the setting tears down the active backend and starts the other.
 * The server backend is also restarted on workspace switch, because the
 * server holds one project per session.
 */
export const init = () => {
  let active: Disposable | null = null;
  let generation = 0;

  const start = async (backend: typeof PgSettings.editor.rustAnalyzer) => {
    const current = ++generation;
    active?.dispose();
    active = null;

    try {
      const disposable =
        backend === "server"
          ? await connectRustAnalyzerServer()
          : await initRustAnalyzer();

      // The setting changed again while this backend was starting
      if (current !== generation) disposable.dispose();
      else active = disposable;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      PgTerminal.println(
        PgTerminal.error(`Rust Analyzer (${backend}): ${message}`)
      );
    }
  };

  // Setting change events fire once on subscription with the current value
  PgSettings.onDidChangeEditorRustAnalyzer(start);
  PgExplorer.onDidSwitchWorkspace(() => {
    const backend = PgSettings.editor.rustAnalyzer;
    if (backend === "server") start(backend);
  });
};
