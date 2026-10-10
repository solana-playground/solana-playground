import { PgCommon } from "./common";
import type { Disposable } from "./types";

/**
 * Rust Analyzer initialization status.
 *
 * `null` means Rust Analyzer is not initializing, either because it hasn't
 * started yet or because it has already finished.
 */
export type RustAnalyzerStatus =
  | "Starting"
  | "Loading default crates"
  | "Loading workspace"
  | null;

export class PgEditor {
  /** All editor event names */
  static readonly events = {
    FOCUS: "editorfocus",
    FORMAT: "editorformat",
    RUST_ANALYZER_STATUS_SET: "editorrustanalyzerstatusset",
  };

  /** Focus the editor. */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(PgEditor.events.FOCUS);
  }

  /** Current Rust Analyzer initialization status */
  static get rustAnalyzerStatus() {
    return PgEditor._rustAnalyzerStatus;
  }

  /**
   * Set the current Rust Analyzer initialization status.
   *
   * @param status status to set, `null` when initialization is complete
   */
  static setRustAnalyzerStatus(status: RustAnalyzerStatus) {
    PgEditor._rustAnalyzerStatus = status;
    PgCommon.createAndDispatchCustomEvent(
      PgEditor.events.RUST_ANALYZER_STATUS_SET,
      status
    );
  }

  /**
   * Run the given callback when Rust Analyzer's initialization status changes.
   *
   * @param cb callback to run
   * @returns a dispose function to clear the event
   */
  static onDidChangeRustAnalyzerStatus(
    cb: (status: RustAnalyzerStatus) => unknown
  ): Disposable {
    return PgCommon.onDidChange(PgEditor.events.RUST_ANALYZER_STATUS_SET, cb, {
      value: PgEditor.rustAnalyzerStatus,
    });
  }

  /** Internal Rust Analyzer initialization status */
  private static _rustAnalyzerStatus: RustAnalyzerStatus = null;
}
