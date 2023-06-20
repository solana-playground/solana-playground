import { createCmd } from "../create-command";
import { PgTerminal } from "../../terminal";

export const clear = createCmd({
  name: "clear",
  description: "Clear terminal",
  run: async () => {
    await PgTerminal.run({ clear: [{ full: true }] });
  },
});
