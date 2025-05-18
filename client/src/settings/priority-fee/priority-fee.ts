import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const priorityFee = createSetting({
  name: "Priority fee",
  tooltip: {
    element: "Priority fee calculation method to use when sending transactions",
    maxWidth: "16rem",
  },
  values: ["average", "median", "min", "max"] as const,
  getValue: () => PgSettings.connection.priorityFee,
  setValue: (v) => (PgSettings.connection.priorityFee = v),
  onChange: PgSettings.onDidChangeConnectionPriorityFee,
});
