import { PgTerminal } from "../../utils/pg";
import { createCmd } from "../create";

export const clear = createCmd({
  name: "clear",
  description: "Clear terminal",
  handle: () => PgTerminal.run({ clear: [{ full: true }] }),
});
