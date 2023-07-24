import type { FC, ReactNode } from "react";
import type { ToastOptions } from "react-toastify";

import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { SetState, SetElementAsync, CallableJSX } from "./types";

/** Sidebar page */
type SidebarPage<N extends string> = {
  /** Name of the page */
  name: N;
  /** `src` of the image */
  icon: string;
  /** Lazy loader for the element */
  importElement: () => Promise<{ default: CallableJSX }>;
  /** Loading element to until the element is ready to show */
  LoadingElement?: CallableJSX;
  /** Title of the page, defaults to `name` */
  title?: string;
  /** Keybind for the page */
  keybind?: string;
};

/** Created sidebar page */
type CreatedSidebarPage<N extends string> = Omit<SidebarPage<N>, "title"> &
  Required<Pick<SidebarPage<N>, "title">>;

export class PgView {
  /**
   * Create a sidebar page.
   *
   * @param page sidebar page
   * @returns the page with correct types
   */
  static createSidebarPage<N extends string>(page: SidebarPage<N>) {
    page.title ??= page.keybind ? `${page.name} (${page.keybind})` : page.name;
    page.icon = "/icons/sidebar/" + page.icon;
    return page as CreatedSidebarPage<N>;
  }

  /**
   * Set the current sidebar state
   *
   * @param state sidebar state to set
   */
  static setSidebarPage(state: SetState<SidebarPageName> = "Explorer") {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_SIDEBAR_STATE_SET,
      state
    );
  }

  /**
   * Set sidebar right component's loading state.
   *
   * @param loading set loading state
   */
  static setSidebarLoading(loading: SetState<boolean>) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_SIDEBAR_LOADING_SET,
      loading
    );
  }

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
        if (result !== undefined) {
          PgCommon.createAndDispatchCustomEvent(eventNames.set, SetEl);
          break;
        }
      } catch {
        await PgCommon.sleep(1000);
      }
    }
  }

  /**
   * Set the current modal and wait until close.
   *
   * @param Component component to set as the modal
   * @param props component props
   * @returns the data from `close` method of the modal
   */
  static async setModal<R, P>(
    Component: ReactNode | FC<P>,
    props?: P
  ): Promise<R | null> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.MODAL_SET, {
      Component,
      props,
    });
  }

  /**
   * Show a notification toast.
   *
   * @param Component component to show
   * @param props component props and toast options
   */
  static setToast<P>(
    Component: ReactNode | FC<P>,
    props?: { componentProps?: P; options?: ToastOptions }
  ) {
    return PgCommon.createAndDispatchCustomEvent(EventName.TOAST_SET, {
      Component,
      props,
    });
  }

  /**
   * Set the new item portal container.
   *
   * New item input will be shown if an element is given.
   *
   * @param Element element to set the portal container to
   */
  static setNewItemPortal(Element: Element | null) {
    return PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_NEW_ITEM_PORTAL_SET,
      Element
    );
  }

  /**
   * Runs after changing sidebar page
   *
   * @param cb callback function to run after changing sidebar page
   * @returns a dispose function to clear the event
   */
  static onDidChangeSidebarPage(cb: (page: SidebarPageName) => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.VIEW_ON_DID_CHANGE_SIDEBAR_PAGE,
    });
  }
}
