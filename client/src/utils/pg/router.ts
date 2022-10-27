import { Location } from "react-router-dom";

import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgRouter {
  static async getLocation(): Promise<Location> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.ROUTER_LOCATION);
  }

  static async getPathname() {
    return (await this.getLocation()).pathname;
  }

  static async navigate(path: string) {
    const { pathname, search } = await this.getLocation();
    if (pathname + search !== path) {
      PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
    }
  }
}
