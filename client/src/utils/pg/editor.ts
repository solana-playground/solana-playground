import { PgCommon } from "./common";

export class PgEditor {
  static readonly EVT_NAME_EDITOR_FOCUS = "editorfocus";

  /**
   * Dispatch custom event to focus editor
   */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_EDITOR_FOCUS);
  }
}
