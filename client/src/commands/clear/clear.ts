import { createCmd, PgTerminal } from "../../utils/pg";

export const clear = createCmd({
  name: "clear",
  description: "Clear terminal",
  run: async () => {
    await PgTerminal.run({ clear: [{ full: true }] });
  },
});
