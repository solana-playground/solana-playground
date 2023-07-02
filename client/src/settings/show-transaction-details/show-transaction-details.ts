import ShowTxDetailsSetting from "./ShowTxDetailsSetting";
import type { Setting } from "../";

export const showTransactionDetails: Setting = {
  name: "Show transaction details",
  Element: ShowTxDetailsSetting,
  tooltip: {
    text: "Whether to automatically fetch transaction details and show them in terminal(only applies to test UI)",
    maxWidth: "18rem",
  },
  isCheckBox: true,
};
