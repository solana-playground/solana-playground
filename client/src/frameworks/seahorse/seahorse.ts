import { createFramework } from "../create";

export const seahorse = createFramework({
  name: "Seahorse",
  description: "Write Anchor-compatible Solana programs in Python.",
  language: "Python",
  circleImage: true,
  docs: {
    url: "https://www.seahorse.dev/using-seahorse/accounts",
  },
  githubExample: {
    name: "Transfer SOL",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/transfer-sol/seahorse",
  },
  getIsCurrent: (files) => {
    for (const [path, content] of files) {
      if (!path.endsWith(".py")) continue;
      const isSeahorse = content.includes("seahorse.prelude");
      if (isSeahorse) return true;
    }

    return false;
  },
});
