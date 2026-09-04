import { createSetting } from "../create";

export const editor = [
  createSetting({
    id: "editor.keybinding",
    values: ["default", "vim"] as const,
    default: "default" as const,
  }),
  createSetting({ id: "editor.wordWrap" }),
  createSetting({
    id: "editor.rustAnalyzer",
    name: "Rust Analyzer",
    description:
      "Where Rust intellisense runs. `Server` uses the build server's " +
      "toolchain (requires a server started with `--features unstable`).",
    values: [
      { name: "Browser (WASM)", value: "wasm" },
      { name: "Server", value: "server" },
    ] as const,
    default: "wasm" as const,
  }),
];
