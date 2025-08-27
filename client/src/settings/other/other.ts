import { PgBlockExplorer } from "../../utils/pg";
import { createSetting } from "../create";

export const other = [
  createSetting({
    id: "other.blockExplorer",
    description: "Default block explorer to use",
    values: (): string[] => PgBlockExplorer.all.map((b) => b.name),
  }),
];
