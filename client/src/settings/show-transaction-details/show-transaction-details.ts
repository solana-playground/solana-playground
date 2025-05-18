import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const showTransactionDetails = createSetting({
  name: "Show transaction details",
  tooltip: {
    element:
      "Whether to automatically fetch transaction details and show them in terminal(only applies to test UI)",
    maxWidth: "18rem",
  },
  getValue: () => PgSettings.testUi.showTxDetailsInTerminal,
  setValue: (v) => (PgSettings.testUi.showTxDetailsInTerminal = v),
  onChange: PgSettings.onDidChangeTestUiShowTxDetailsInTerminal,
});
