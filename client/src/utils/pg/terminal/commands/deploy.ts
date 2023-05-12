import { createCmd, PgCommandCheck } from "./_command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  process: async () => {
    return await PgCommon.sendAndReceiveCustomEvent<number | undefined>(
      EventName.COMMAND_DEPLOY
    );
  },
  preCheck: PgCommandCheck.isPgConnected,
});
