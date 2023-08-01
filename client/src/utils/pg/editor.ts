import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgEditor {
  /** Focus the editor. */
  static focus() {
    PgCommon.createAndDispatchCustomEvent(EventName.EDITOR_FOCUS);
  }
}
