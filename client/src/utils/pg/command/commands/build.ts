import { createCmd } from "../create-command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const build = createCmd({
  name: "build",
  description: "Build your program",
  run: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.COMMAND_BUILD);
  },
});
