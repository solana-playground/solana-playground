import { PgBlockExplorer } from "../../utils/pg";
import { createSetting } from "../create";

export const blockExplorer = createSetting({
  id: "other.blockExplorer",
  name: "Block explorer",
  description: "Default block explorer to use",
  values: (): string[] => PgBlockExplorer.all.map((b) => b.name),
});
