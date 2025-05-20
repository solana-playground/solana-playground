import { createSetting } from "../create";

const values = ["average", "median", "min", "max"] as const;

export const priorityFee = createSetting({
  id: "connection.priorityFee",
  name: "Priority fee",
  tooltip: {
    element: "Priority fee calculation method to use when sending transactions",
    maxWidth: "16rem",
  },
  // Add `number` to the types for custom values
  values: values as unknown as [...typeof values, number],
});
