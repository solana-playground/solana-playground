// TODO: Remove this

import { pgChannel } from "../../channel";

export class PgTerminal {
  static enable() {}
  static logWasm(msg: string) {
    pgChannel.appendLine(msg);
  }
}
