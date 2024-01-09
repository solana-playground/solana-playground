import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const native = createFramework({
  name: "Native",
  language: Lang.RUST,
  icon: "/icons/platforms/solana.png",
  githubExample: {
    name: "Hello Solana",
    // Only import the program for now since `fs` and `os` modules are not
    // implemented in Playground. We could solve it by converting the code
    // where it reads the user keypair and the program keypair but the goal
    // is to make everything that works in a local Node environment work in
    // Playground without any modifications.
    // TODO: Implement `fs` and `os` modules.
    // url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native/program",
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
