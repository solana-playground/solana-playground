import { ComponentType } from "react";

import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgModal {
  /**
   * Set the current modal and wait until close
   *
   * @param el React component to be set as the modal
   * @returns the data from `close` method of the modal
   */
  static async set<T>(el: ComponentType | null): Promise<T> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.MODAL_SET, {
      el,
    });
  }
}
