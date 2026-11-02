import { createFramework, getIsCurrentCommon } from "../create";

export const pinocchio = createFramework({
  name: "Pinocchio",
  description: "Create Solana programs with no external dependencies attached",
  language: "Rust",
  circleImage: true,
  docs: {
    url: "https://github.com/anza-xyz/pinocchio",
  },
  githubExample: {
    name: "Transfer SOL",
    // TODO: Also include tests after they are supported
    url: "https://github.com/solana-foundation/program-examples/tree/782440834198a9ff761e9bad48bafa246e0c4336/basics/transfer-sol/pinocchio/program",
  },
  getIsCurrent: (files) => getIsCurrentCommon(files, ".rs", "pinocchio"),
});
