import { createFramework } from "../create";

export const seahorse = createFramework({
  name: "Seahorse",
  language: "Python",
  circleImage: true,
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
