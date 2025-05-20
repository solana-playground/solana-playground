import { createSetting } from "../create";

export const showTransactionDetails = createSetting({
  id: "testUi.showTxDetailsInTerminal",
  name: "Show transaction details",
  tooltip: {
    element:
      "Whether to automatically fetch transaction details and show them in terminal(only applies to test UI)",
    maxWidth: "18rem",
  },
});
