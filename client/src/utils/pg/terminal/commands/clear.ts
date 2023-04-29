import { PgCommandHelper } from "./__command";
import { PgTerminal } from "../terminal";

export const clear = PgCommandHelper.create({
  name: "clear",
  description: "Clear terminal",
  process: async () => {
    await PgTerminal.run({ clear: [{ full: true }] });
  },
});
