import { createElement, FC } from "react";
import type { ToastOptions } from "react-toastify";

import { PgCommon } from "./common";
import {
  createDerivable,
  declareDecorator,
  derivable,
  updatable,
} from "./decorators";
import type {
  SetState,
  Disposable,
  RequiredKey,
  SyncOrAsync,
  Elementable,
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
  importComponent?: () => Promise<{ default: FC }>;
  /** Loading component to show until the page element is ready */
  LoadingComponent?: FC;
};

/** Created sidebar page */
export type SidebarPage<N extends string = string> = RequiredKey<
  SidebarPageParam<N>,
  "title" | "importComponent"
>;

interface ViewState {
  sidebar: {
    name: SidebarPageName;
    props: Record<string, unknown>;
    loadingCount: number;
  };
}

const defaultState: ViewState = {
  sidebar: {
    name: "Explorer",
    props: {},
    loadingCount: 0,
  },
};

const recursive = true;

const derive = () => ({
  /** Current sidebar page */
  currentSidebarPage: createDerivable({
    derive: (name) => _PgView.allSidebarPages.find((p) => p.name === name)!,
    onChange: "sidebar.name",
  }),
});

@derivable(derive)
@updatable({ defaultState, recursive })
class _PgView {
  /** All sidebar pages */
  static allSidebarPages: SidebarPage<SidebarPageName>[];

  /** All view event names */
  static readonly events = {
    MAIN_PRIMARY_STATIC: "viewmainprimarystatic",
    MAIN_SECONDARY_HEIGHT_SET: "viewmainsecondaryheightset",
    MAIN_SECONDARY_PAGE_SET: "viewmainsecondarypageset",
    MAIN_SECONDARY_PROGRESS_SET: "viewmainsecondaryprogressset",
    MODAL_SET: "viewmodalset",
    TOAST_SET: "viewtoastset",
    TOAST_CLOSE: "viewtoastclose",
    NEW_ITEM_PORTAL_SET: "viewnewitemportalset",
    ON_DID_CHANGE_MAIN_SECONDARY_PAGE: "viewondidchangemainsecondarypage",
  };

  /** DOM class names */
  static classNames = {
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
   * Set sidebar right component's loading state.
   *
   * **NOTE:** The boolean values are used to either increment or decrement the
   * ongoing process count. Setting the `loading` to `false` only decrements
   * the process count and the loading state is only disabled if there is no
   * other ongoing process.
   *
   * @param loading whether the sidebar should show loading state
   */
  static setSidebarLoading(loading: boolean) {
    // There could be multiple processes that change the loading state, and the
    // overall loading state should only be disabled when all processes complete
    if (loading) PgView.sidebar.loadingCount++;
    else PgView.sidebar.loadingCount--;
  }

  /**
   * Set the primary main view (next to the sidebar and above the terminal).
   *
   * @param setEl element to set the main view to
   */
  static async setMainPrimary(setEl: SetState<SyncOrAsync<Elementable>>) {
    await PgCommon.tryUntilSuccess(async () => {
      const eventNames = PgCommon.getStaticStateEventNames(
        PgView.events.MAIN_PRIMARY_STATIC
      );
      const result = await PgCommon.sendAndReceiveCustomEvent(eventNames.get);
      if (result === undefined) throw new Error();

      PgCommon.createAndDispatchCustomEvent(eventNames.set, setEl);
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

  /**
   * Set the current modal and wait until close.
   *
   * @param elementable elementable to set as the modal
   * @param props component props
   * @returns the data from `close` method of the modal
   */
  static async setModal<R, P extends Record<string, any> = {}>(
    elementable: Elementable<P>,
    props?: P
  ): Promise<R | null> {
    return await PgCommon.sendAndReceiveCustomEvent(PgView.events.MODAL_SET, {
      elementable,
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
   * @param elementable component to show
   * @param props component props and toast options
   */
  static setToast<P extends Record<string, unknown>>(
    elementable: Elementable<P>,
    props?: { componentProps?: P; options?: ToastOptions }
  ) {
    return PgCommon.createAndDispatchCustomEvent(PgView.events.TOAST_SET, {
      elementable,
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
   * Runs after changing the secondary main view page.
   *
   * @param cb callback function to run after changing the secondary main view page
   * @returns a dispose function to clear the event
   */
  static onDidChangeMainSecondaryPage(
    cb: (page: MainSecondaryPageName) => unknown
  ) {
    return PgCommon.onDidChange(
      PgView.events.ON_DID_CHANGE_MAIN_SECONDARY_PAGE,
      cb
    );
  }

  /**
   * Normalize element i.e. convert components to elements and keep elemenets
   * the same.
   *
   * @param elementable element or component
   * @param props props to pass to the component (unused for elements)
   * @returns the normalized element
   */
  static normalizeElement<
    P extends Record<string, unknown> = Record<string, unknown>
  >(elementable: Elementable<P>, props?: P) {
    if (typeof elementable === "object") return elementable;
    return createElement(elementable, props);
  }
}

export const PgView = declareDecorator(_PgView, {
  derivable: derive,
  updatable: { defaultState, recursive },
});
