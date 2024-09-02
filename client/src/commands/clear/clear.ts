import { PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const clear = createCmd({
  name: "clear",
  description: "Clear terminal",
  run: () => PgTerminal.run({ clear: [{ full: true }] }),
});
