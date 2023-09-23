import { createSetting } from "../create";

export const showTransactionDetails = createSetting({
  name: "Show transaction details",
  tooltip: {
    text: "Whether to automatically fetch transaction details and show them in terminal(only applies to test UI)",
    maxWidth: "18rem",
  },
  isCheckBox: true,
});
