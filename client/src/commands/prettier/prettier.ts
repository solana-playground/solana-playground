import { EventName } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { createCmd } from "../create";

export const prettier = createCmd({
  name: "prettier",
  description: "Format the current file with prettier",
  run: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
      lang: "TypeScript",
      fromTerminal: true,
    });
  },
});
