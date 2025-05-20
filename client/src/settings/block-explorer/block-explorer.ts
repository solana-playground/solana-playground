import { PgBlockExplorer } from "../../utils/pg";
import { createSetting } from "../create";

export const blockExplorer = createSetting({
  id: "other.blockExplorer",
  name: "Block explorer",
  tooltip: {
    element: "Default block explorer to use",
  },
  values: (): string[] => PgBlockExplorer.all.map((b) => b.name),
});
