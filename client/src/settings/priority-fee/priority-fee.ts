import { PgCommon } from "../../utils/pg";
import { createSetting } from "../create";

const values = ["average", "median", "min", "max"] as const;

export const priorityFee = createSetting({
  id: "connection.priorityFee",
  name: "Priority fee",
  description:
    "Priority fee calculation method to use when sending transactions",
  // Add `number` to the types for custom values
  values: values as unknown as [...typeof values, number],
  customValueValidator: PgCommon.isInt,
});
