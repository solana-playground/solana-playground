import { PgCommon, PgEditor } from "../../utils/pg";
import { createCmd } from "../create";

export const prettier = createCmd({
  name: "prettier",
  description: "Format the current file with prettier",
  handle: async () => {
    await PgCommon.sendAndReceiveCustomEvent(PgEditor.events.FORMAT, {
      lang: "TypeScript",
      fromTerminal: true,
    });
  },
});
