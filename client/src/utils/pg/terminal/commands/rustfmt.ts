import { PgCommandHelper } from "./__command";
import { PgCommon } from "../../common";
import { Lang } from "../../explorer";
import { EventName } from "../../../../constants";

export const rustfmt = PgCommandHelper.create({
  name: "rustfmt",
  description: "Format the current file with rustfmt",
  process: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
      lang: Lang.RUST,
      fromTerminal: true,
    });
  },
});
