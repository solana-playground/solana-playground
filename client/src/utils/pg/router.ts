import { EventName } from "../../constants";
import { PgCommon } from "./common";

export class PgRouter {
  static async getPath(): Promise<string> {
    return await PgCommon.sendAndReceiveCustomEvent(EventName.ROUTER_PATHNAME);
  }

  static async navigate(path: string) {
    const currentPath = await this.getPath();
    if (currentPath !== path) {
      PgCommon.createAndDispatchCustomEvent(EventName.ROUTER_NAVIGATE, path);
    }
  }
}
