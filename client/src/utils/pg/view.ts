import { ComponentType } from "react";

import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { PgSet, SetElementAsync } from "./types";

/** Sidebar states */
export enum Sidebar {
  CLOSED = "Closed",
  EXPLORER = "Explorer",
  // SEARCH = "Search",
  BUILD_DEPLOY = "Build & Deploy",
  TEST = "Test",
  TUTORIALS = "Tutorials",
  GITHUB = "Github",
  WALLET = "Wallet",
  SETTINGS = "Settings",
}

/** Each item props in left sidebar */
export interface SidebarIcon {
  title: string;
  src: string;
  value: Sidebar;
}

/** Left sidebar data */
export type SidebarData = { [K in "top" | "bottom"]: SidebarIcon[] };

export class PgView {
  /**
   * Set main view(next to the sidebar and above the terminal)
   *
   * @param SetEl element to set the main view to. (default: Editor)
   */
  static async setMain(SetEl?: SetElementAsync) {
    while (1) {
      try {
        const eventNames = PgCommon.getStaticStateEventNames(
          EventName.VIEW_MAIN_STATIC
        );
        const result = await PgCommon.timeout(
          PgCommon.sendAndReceiveCustomEvent(eventNames.get)
        );
        if (result) {
          PgCommon.createAndDispatchCustomEvent(eventNames.set, SetEl);
          break;
        }
      } catch {
        await PgCommon.sleep(1000);
      }
    }
  }

  /**
   * Set the current modal and wait until close
   *
   * @param el React component to be set as the modal
   * @returns the data from `close` method of the modal
   */
  static async setModal<R>(
    el: ComponentType<any> | null,
    props: object = {}
  ): Promise<R | null> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.MODAL_SET, {
      el,
      props,
    });
  }

  /**
   * Set the current sidebar state
   *
   * @param state sidebar state to set
   */
  static setSidebarState(state: PgSet<Sidebar>) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_SIDEBAR_STATE_SET,
      state
    );
  }

  /**
   * Runs after changing sidebar state
   *
   * @param cb callback function to run after changing sidebar page
   * @returns a dispose function to clear the event
   */
  static onDidChangeSidebarState(cb: (state: Sidebar) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.VIEW_ON_DID_CHANGE_SIDEBAR_STATE,
    });
  }
}
