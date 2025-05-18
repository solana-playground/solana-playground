import { PgBlockExplorer, PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const blockExplorer = createSetting({
  name: "Block explorer",
  tooltip: {
    element: "Default block explorer to use",
  },
  values: () => PgBlockExplorer.all.map((b) => b.name),
  getValue: () => PgSettings.other.blockExplorer,
  setValue: (v) => (PgSettings.other.blockExplorer = v),
  onChange: PgSettings.onDidChangeOtherBlockExplorer,
});
