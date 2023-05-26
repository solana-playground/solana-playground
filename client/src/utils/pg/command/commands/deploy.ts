import { createCmd } from "../create-command";
import { PgCommandValidation } from "../validation";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  run: async () => {
    return await PgCommon.sendAndReceiveCustomEvent<number | undefined>(
      EventName.COMMAND_DEPLOY
    );
  },
  preCheck: PgCommandValidation.isPgConnected,
});
