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
      "Where Rust intellisense runs. `Browser (WASM)` resolves against " +
      "bundled Anchor 0.29 crates. `Server` uses the build server's " +
      "toolchain, so it matches the project's template versions (requires " +
      "a server started with `--features unstable`).",
    values: [
      { name: "Browser (WASM)", value: "wasm" },
      { name: "Server", value: "server" },
    ] as const,
    default: "wasm" as const,
  }),
];
