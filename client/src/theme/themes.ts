import type { ImportableTheme } from "../utils/pg";

/** All available themes */
export const THEMES: ImportableTheme[] = [
  { name: "Dracula", importTheme: () => import("./themes/dracula") },
  { name: "Solana", importTheme: () => import("./themes/solana") },
  { name: "Playground", importTheme: () => import("./themes/playground") },
  { name: "Light", importTheme: () => import("./themes/light") },
];
