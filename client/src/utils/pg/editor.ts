import { PgCommon } from "./common";

export class PgEditor {
  static EVT_NAME_EDITOR_FOCUS = "editorfocus";

  /**
   * Focus editor
   */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(this.EVT_NAME_EDITOR_FOCUS);
  }
}
