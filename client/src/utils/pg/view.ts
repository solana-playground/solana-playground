import type { FC, ReactNode } from "react";
import type { ToastOptions } from "react-toastify";

import { PgCommon } from "./common";
import type {
  SetState,
  SetElementAsync,
  Disposable,
  CallableJSX,
  RequiredKey,
} from "./types";

/** Sidebar page param */
export type SidebarPageParam<N extends string> = {
  /** Name of the page */
  name: N;
  /** `src` of the image */
  icon: string;
  /** Title of the page, defaults to `name` */
  title?: string;
  /** Keybind for the page */
  keybind?: string;
  /** Route to navigate to */
  route?: RoutePath;
  /** Handle the page logic */
  handle?: () => Disposable | void;
  /** Lazy loader for the element */
  importComponent?: () => Promise<{ default: CallableJSX }>;
  /** Loading element to until the element is ready to show */
  LoadingElement?: CallableJSX;
};

/** Created sidebar page */
export type SidebarPage<N extends string = string> = RequiredKey<
  SidebarPageParam<N>,
  "title" | "importComponent"
>;

export class PgView {
  /** All sidebar pages */
  static sidebar: SidebarPage<SidebarPageName>[];

  /** All view event names */
  static events = {
    MAIN_PRIMARY_STATIC: "viewmainprimarystatic",
    MAIN_SECONDARY_HEIGHT_SET: "viewmainsecondaryheightset",
    MAIN_SECONDARY_FOCUS: "viewmainsecondaryfocus",
    MAIN_SECONDARY_PAGE_SET: "viewmainsecondarypageset",
    MAIN_SECONDARY_PROGRESS_SET: "viewmainsecondaryprogressset",
    SIDEBAR_PAGE_NAME_SET: "viewsidebarpagenameset",
    SIDEBAR_PAGE_PROPS_SET: "viewsidebarpagepropsset",
    SIDEBAR_LOADING_SET: "viewsidebarloadingset",
    MODAL_SET: "viewmodalset",
    TOAST_SET: "viewtoastset",
    TOAST_CLOSE: "viewtoastclose",
    NEW_ITEM_PORTAL_SET: "viewnewitemportalset",
    ON_DID_CHANGE_SIDEBAR_PAGE: "viewondidchangesidebarpage",
    ON_DID_CHANGE_MAIN_SECONDARY_PAGE: "viewondidchangemainsecondarypage",
  };

  /** DOM class names */
  static classNames = {
    ACTIVE: "active",
    ERROR: "error",
    SUCCESS: "success",
    OPEN: "open",
    HIDDEN: "hidden",
    TOUCHED: "touched",
    SELECTED: "selected",
    CTX_SELECTED: "ctx-selected",
    FILE: "file",
    FOLDER: "folder",
    FOLDER_INSIDE: "folder-inside",
    LOADING: "loading",
    DARKEN: "darken",
    BUTTON_LOADING: "btn-loading",
  };

  /** DOM ids */
  static ids = {
    ROOT: "root",
    ROOT_DIR: "root-dir",
    BOTTOM: "bottom",
    TABS: "tabs",
    WALLET_MAIN: "wallet-main",
    HOME: "home",
    PORTAL_ABOVE: "portal-above",
    PORTAL_BELOW: "portal-below",
  };

  /**
   * Set the current sidebar page.
   *
   * @param page sidebar page to set
   */
  static getSidebarPage(name: SidebarPageName) {
    return this.sidebar.find((s) => s.name === name)!;
  }

  /**
   * Set the current sidebar page.
   *
   * @param page sidebar page to set
   */
  static setSidebarPage(page: SetState<SidebarPageName> = "Explorer") {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.SIDEBAR_PAGE_NAME_SET,
      page
    );
  }

  /**
   * Set the current sidebar page props.
   *
   * @param page sidebar page to set
   */
  static setSidebarPageProps(props: Record<string, any>) {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.SIDEBAR_PAGE_PROPS_SET,
      props
    );
  }

  /**
   * Set sidebar right component's loading state.
   *
   * **NOTE:** The boolean values are used to either increment or decrement the
   * ongoing process count. Setting the `loading` to `false` only decrements
   * the process count and the loading state is only disabled if there is no
   * other ongoing process.
   *
   * @param loading set loading state
   */
  static setSidebarLoading(loading: SetState<boolean>) {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.SIDEBAR_LOADING_SET,
      loading
    );
  }

  /**
   * Set the primary main view (next to the sidebar and above the terminal).
   *
   * @param SetEl element to set the main view to
   */
  static async setMainPrimary(SetEl: SetElementAsync) {
    await PgCommon.tryUntilSuccess(async () => {
      const eventNames = PgCommon.getStaticStateEventNames(
        PgView.events.MAIN_PRIMARY_STATIC
      );
      const result = await PgCommon.sendAndReceiveCustomEvent(eventNames.get);
      if (result === undefined) throw new Error();

      PgCommon.createAndDispatchCustomEvent(eventNames.set, SetEl);
    }, 100);
  }

  /** Get the default height of the main secondary view. */
  static getMainSecondaryDefaultHeight() {
    return Math.floor(window.innerHeight / 4);
  }

  /** Get the minimum height of the main secondary view. */
  static getMainSecondaryMinHeight() {
    // TODO: Make it dynamic?
    return 36;
  }

  /** Get the maximum height of the main secondary view. */
  static getMainSecondaryMaxHeight() {
    const bottomHeight = document
      .getElementById(PgView.ids.BOTTOM)
      ?.getBoundingClientRect()?.height;
    return window.innerHeight - (bottomHeight ?? 0);
  }

  /**
   * Set the current secondary main view page.
   *
   * @param page secondary main view page to set
   */
  static setMainSecondaryPage(
    page: SetState<MainSecondaryPageName> = "Terminal"
  ) {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.MAIN_SECONDARY_PAGE_SET,
      page
    );
  }

  /**
   * Set secondary main view progress bar percentage.
   *
   * Progress bar will be hidden if `progress` is set to 0.
   *
   * @param progress progress percentage in 0-100
   */
  static setMainSecondaryProgress(progress: number) {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.MAIN_SECONDARY_PROGRESS_SET,
      progress
    );
  }

  /**
   * Set the secondary main view's height.
   *
   * @param height height to set in px
   */
  static setMainSecondaryHeight(height: SetState<number>) {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.MAIN_SECONDARY_HEIGHT_SET,
      height
    );
  }

  static focusMainSecondary() {
    PgCommon.createAndDispatchCustomEvent(PgView.events.MAIN_SECONDARY_FOCUS);
  }

  /**
   * Set the current modal and wait until close.
   *
   * @param Component component to set as the modal
   * @param props component props
   * @returns the data from `close` method of the modal
   */
  static async setModal<R, P extends Record<string, any> = {}>(
    Component: ReactNode | FC<P>,
    props?: P
  ): Promise<R | null> {
    return await PgCommon.sendAndReceiveCustomEvent(PgView.events.MODAL_SET, {
      Component,
      props,
    });
  }

  /**
   * Close the current modal.
   *
   * @param data data to be resolved from the modal
   */
  static closeModal(data?: any) {
    // `data` will be a `ClickEvent` if the modal has been closed with the
    // default Cancel button
    if (data?.target) data = null;

    PgCommon.createAndDispatchCustomEvent(
      PgCommon.getSendAndReceiveEventNames(PgView.events.MODAL_SET).receive,
      { data }
    );

    PgView.setModal(null);
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
    return PgCommon.createAndDispatchCustomEvent(PgView.events.TOAST_SET, {
      Component,
      props,
    });
  }

  /**
   * Close either the given toast or, all toasts if `id` is not given.
   *
   * @param id toast id
   */
  static closeToast(id?: number) {
    return PgCommon.createAndDispatchCustomEvent(PgView.events.TOAST_CLOSE, id);
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
      PgView.events.NEW_ITEM_PORTAL_SET,
      Element
    );
  }

  /**
   * Runs after changing sidebar page.
   *
   * @param cb callback function to run after changing sidebar page
   * @returns a dispose function to clear the event
   */
  static onDidChangeSidebarPage(cb: (page: SidebarPage) => unknown) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgView.events.ON_DID_CHANGE_SIDEBAR_PAGE,
    });
  }

  /**
   * Runs after changing the secondary main view page.
   *
   * @param cb callback function to run after changing the secondary main view page
   * @returns a dispose function to clear the event
   */
  static onDidChangeMainSecondaryPage(
    cb: (page: MainSecondaryPageName) => unknown
  ) {
    return PgCommon.onDidChange({
      cb,
      eventName: PgView.events.ON_DID_CHANGE_MAIN_SECONDARY_PAGE,
    });
  }
}
