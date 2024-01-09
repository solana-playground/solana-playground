import { EventName } from "../../constants";
import { createCmd, Lang, PgCommon } from "../../utils/pg";

export const rustfmt = createCmd({
  name: "rustfmt",
  description: "Format the current file with rustfmt",
  run: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
      lang: Lang.RUST,
      fromTerminal: true,
    });
  },
});
