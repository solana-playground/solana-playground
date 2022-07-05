export class PgTerminal {
  /**
   * Log terminal messages from anywhere
   *
   * Mainly used from WASM
   */
  static logWasm(msg: string) {
    const customLogEvent = new CustomEvent("terminallog", { detail: { msg } });

    document.dispatchEvent(customLogEvent);
  }
}
