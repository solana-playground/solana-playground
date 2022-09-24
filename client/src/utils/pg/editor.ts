import { ClassName, EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgEditor {
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
      .getElementsByClassName(ClassName.CM_CLASSNAME)[0]
      ?.classList.contains(ClassName.CM_ACTIVE_CLASSNAME);
  }
}
