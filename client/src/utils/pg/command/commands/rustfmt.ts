import { createCmd } from "../create-command";
import { PgCommon } from "../../common";
import { Lang } from "../../explorer";
import { EventName } from "../../../../constants";

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
