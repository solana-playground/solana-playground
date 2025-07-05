import { PgCommon } from "../../utils/pg";
import { createSetting } from "../create";

export const priorityFee = createSetting({
  id: "connection.priorityFee",
  name: "Priority fee",
  description:
    "Priority fee calculation method to use when sending transactions",
  values: ["average", "median", "min", "max"] as const,
  custom: {
    parse: (v) => {
      if (PgCommon.isInt(v)) return parseInt(v);
      throw new Error(`The setting value must be an integer: ${v}`);
    },
    type: "micro lamports",
    placeholder: "9000",
    tip: "Check out the priority fees [guide](https://solana.com/developers/guides/advanced/how-to-use-priority-fees) for more information.",
  },
});
