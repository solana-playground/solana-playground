import type { FC, ReactNode } from "react";
import type { ToastOptions } from "react-toastify";

import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { SetState, SetElementAsync } from "./types";

export class PgView {
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
   * **NOTE:** The boolean values are used to either increment or decrement the
   * ongoing process count. Setting the `loading` to `false` only decrements
   * the process count and the loading state is only disabled if there is no
   * other ongoing process.
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
   * Set the main view(next to the sidebar and above the terminal).
   *
   * @param SetEl element to set the main view to
   */
  static async setMain(SetEl: SetElementAsync) {
    await PgCommon.tryUntilSuccess(async () => {
      const eventNames = PgCommon.getStaticStateEventNames(
        EventName.VIEW_MAIN_PRIMARY_STATIC
      );
      const result = await PgCommon.timeout(
        PgCommon.sendAndReceiveCustomEvent(eventNames.get),
        100
      );
      if (result === undefined) throw new Error();

      PgCommon.createAndDispatchCustomEvent(eventNames.set, SetEl);
    }, 1000);
  }

  /**
   * Set main secondary height.
   *
   * @param height height to set in px
   */
  static setMainSecondaryHeight(height: SetState<number>) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_MAIN_SECONDARY_HEIGHT_SET,
      height
    );
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
    return await PgCommon.sendAndReceiveCustomEvent(EventName.MODAL_SET, {
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
      PgCommon.getSendAndReceiveEventNames(EventName.MODAL_SET).receive,
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
    return PgCommon.createAndDispatchCustomEvent(EventName.TOAST_SET, {
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
    return PgCommon.createAndDispatchCustomEvent(EventName.TOAST_CLOSE, id);
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
