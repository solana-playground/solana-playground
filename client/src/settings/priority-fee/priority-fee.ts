import { createSetting } from "../create";

export const priorityFee = createSetting({
  name: "Priority fee",
  tooltip: {
    element: "Priority fee calculation method to use when sending transactions",
    maxWidth: "16rem",
  },
});
