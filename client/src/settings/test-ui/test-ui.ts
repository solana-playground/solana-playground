import { createSetting } from "../create";

export const testUi = [
  createSetting({
    id: "testUi.showTxDetailsInTerminal",
    name: "Show transaction details",
    description:
      "Whether to automatically fetch transaction details and show them in terminal (only applies to test UI)",
  }),
];
