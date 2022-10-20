import { EventName, Id } from "../../constants";
import { PgCommon } from "./common";

export class PgView {
  /**
   * Set main view.
   *
   * @param El element to set the main view to. If empty, default editor will be set.
   */
  static setMain(El?: () => JSX.Element) {
    PgCommon.createAndDispatchCustomEvent(EventName.VIEW_MAIN_SET, { El });
  }

  /**
   * @returns the available height for the main view
   */
  static getMainViewHeight() {
    const tabHeight =
      document.getElementById(Id.TABS)?.getBoundingClientRect()?.height ?? 32;
    const bottomHeight =
      document.getElementById(Id.BOTTOM)?.getBoundingClientRect()?.height ?? 24;
    const terminalHeight =
      document.getElementById(Id.TERMINAL)?.getBoundingClientRect()?.height ??
      244;

    return window.innerHeight - (tabHeight + bottomHeight + terminalHeight);
  }
}
