import { createCmd } from "./_command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  process: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.COMMAND_CONNECT);
  },
});
