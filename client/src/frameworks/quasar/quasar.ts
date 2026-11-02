import { createFramework, getIsCurrentCommon } from "../create";

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
    url: "https://github.com/blueshift-gg/quasar/tree/863ee777a4520dba165f15bb1037bed1f2f739b8/examples/escrow",
  },
  getIsCurrent: (files) => {
    return getIsCurrentCommon(files, "lib.rs", ["quasar_lang", "#[program]"]);
  },
});
