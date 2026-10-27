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
    name: "Create Account",
    // TODO: Also include tests after they are supported
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/create-account/pinocchio/program",
  },
  getIsCurrent: (files) => getIsCurrentCommon(files, ".rs", "pinocchio"),
});
