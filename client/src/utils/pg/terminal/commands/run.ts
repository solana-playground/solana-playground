import { PgCommandHelper } from "./__command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const run = PgCommandHelper.create({
  name: "run",
  description: "Run script(s)",
  process: async (input) => {
    const match = new RegExp(/^\w+\s?(.*)/).exec(input);
    await PgCommon.sendAndReceiveCustomEvent(EventName.CLIENT_RUN, {
      isTest: false,
      path: match && match[1],
    });
  },
});
