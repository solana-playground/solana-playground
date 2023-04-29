import { PgCommandHelper } from "./__command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const build = PgCommandHelper.create({
  name: "build",
  description: "Build your program",
  process: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.COMMAND_BUILD);
  },
});
