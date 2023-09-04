import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const native = createFramework({
  name: "Native",
  language: Lang.RUST,
  icon: "/icons/platforms/solana.png",
  githubExample: {
    name: "Hello Solana",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native",
  },
  getIsCurrent: (files) => {
    for (const [path, content] of files) {
      if (!path.endsWith(".rs")) continue;
      const hasEntryPointMacro = content.includes("entrypoint!");
      if (hasEntryPointMacro) return true;
    }

    return false;
  },
});
