import { createFramework } from "../create";

export const quasar = createFramework({
  name: "Quasar",
  description: "A blazing fast Solana program framework",
  language: "Rust",
  circleImage: true,
  docs: {
    url: "https://quasar-lang.com",
  },
  githubExample: {
    name: "Escrow",
    // TODO: Also include tests after they are supported
    url: "https://github.com/blueshift-gg/quasar/tree/b0de7db4cd271654a2dcf78807dd865e98e0b339/examples/escrow",
  },
  getIsCurrent: (files) => {
    // TODO: Check `Cargo.toml`
    for (const [path, content] of files) {
      if (path.endsWith("lib.rs")) return content.includes("quasar_lang");
    }

    return false;
  },
});
