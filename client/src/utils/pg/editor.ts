import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgEditor {
  static readonly CLASSNAME = "cm-editor";
  static readonly ACTIVE_CLASSNAME = "cm-focused";

  /**
   * Dispatch custom event to focus editor
   */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FOCUS);
  }

  /**
   * Get whether the editor is currently in focus
   */
  static isFocused() {
    return document
      .getElementsByClassName(this.CLASSNAME)[0]
      ?.classList.contains(this.ACTIVE_CLASSNAME);
  }
}
