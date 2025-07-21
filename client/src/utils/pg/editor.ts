import { PgCommon } from "./common";

export class PgEditor {
  /** All editor event names */
  static readonly events = {
    FOCUS: "editorfocus",
    FORMAT: "editorformat",
  };

  /** Focus the editor. */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(PgEditor.events.FOCUS);
  }
}
