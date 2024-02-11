import { EventName } from "../../constants";
import { Lang, PgCommon } from "../../utils/pg";
import { createCmd } from "../create";

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
