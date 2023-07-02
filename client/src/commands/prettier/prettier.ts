import { EventName } from "../../constants";
import { createCmd, Lang, PgCommon } from "../../utils/pg";

export const prettier = createCmd({
  name: "prettier",
  description: "Format the current file with prettier",
  run: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
      lang: Lang.TYPESCRIPT,
      fromTerminal: true,
    });
  },
});
