import { PgCommon } from "./common";
import { EventName } from "../../constants";

export class PgBuild {
  /**
   * @param cb callback function to run after program deployment
   * @returns a dispose function to clear the event
   */
  static onDidBuild(cb: () => void) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.BUILD_ON_DID_BUILD,
      initialRun: { value: null },
    });
  }
}
