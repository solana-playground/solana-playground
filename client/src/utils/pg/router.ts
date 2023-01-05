import { Location } from "react-router-dom";

import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgRouter {
  /**
   * @returns the current URL location
   */
  static async getLocation(): Promise<Location> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.ROUTER_LOCATION);
  }

  /**
   * Navigate to the given path
   *
   * @param path pathname to navigate to
   */
  static async navigate(path: string) {
    const location = await PgCommon.timeout(this.getLocation(), 200);
    if (!location) {
      PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
    } else {
      if (!this.comparePaths(location.pathname + location.search, path)) {
        PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
      }
    }
  }

  /**
   * Compare pathnames to each other
   *
   * @param pathOne First path
   * @param pathTwo Second path
   * @returns Whether the paths are equal
   */
  static comparePaths(pathOne: string, pathTwo: string) {
    return PgCommon.appendSlash(pathOne) === PgCommon.appendSlash(pathTwo);
  }
}
