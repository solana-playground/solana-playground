import { PgCommon, PgEditor } from "../../utils/pg";
import { createCmd } from "../create";

export const rustfmt = createCmd({
  name: "rustfmt",
  description: "Format the current file with rustfmt",
  handle: async () => {
    await PgCommon.sendAndReceiveCustomEvent(PgEditor.events.FORMAT, {
      lang: "Rust",
      fromTerminal: true,
    });
  },
});
