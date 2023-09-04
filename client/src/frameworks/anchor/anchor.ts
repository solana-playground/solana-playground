import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const anchor = createFramework({
  name: "Anchor",
  language: Lang.RUST,
  icon: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
  githubExample: {
    name: "Create Account",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/create-account/anchor",
  },
  getIsCurrent: (files) => {
    // Return false if there is a Python file(Seahorse) otherwise this will
    // return a false positive because every Seahorse workspace is a valid
    // Anchor workspace.
    //
    // TODO: Handle this check from Seahorse side. Ideally we wouldn't need to
    // include Seahorse related checks in any of the Anchor files.
    const isSeahorse = files.some(([path]) => path.endsWith(".py"));
    if (isSeahorse) return false;

    for (const [path, content] of files) {
      if (!path.endsWith("lib.rs")) continue;
      const hasProgramMacro = content.includes("#[program]");
      if (hasProgramMacro) return true;
    }

    return false;
  },
});
