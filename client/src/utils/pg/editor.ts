import { PgCommon } from "./common";

export class PgEditor {
  /** All editor event names */
  static events = {
    FOCUS: "editorfocus",
    FORMAT: "editorformat",
  };

  /** Focus the editor. */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(PgEditor.events.FOCUS);
  }
}
