import { createSetting } from "../create";

export const editor = [
  createSetting({
    id: "editor.keybinding",
    values: ["default", "vim"] as const,
    default: "default" as const,
  }),
  createSetting({ id: "editor.wordWrap" }),
];
