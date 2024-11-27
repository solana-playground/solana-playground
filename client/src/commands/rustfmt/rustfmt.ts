import { EventName } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { createCmd } from "../create";

export const rustfmt = createCmd({
  name: "rustfmt",
  description: "Format the current file with rustfmt",
  run: async () => {
    await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT, {
      lang: "Rust",
      fromTerminal: true,
    });
  },
});
