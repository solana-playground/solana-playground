import { PgFramework } from "../../utils";
import { createFramework, getIsCurrentCommon } from "../create";

export const native = createFramework({
  name: "Native",
  description: "Solana programs without a framework.",
  language: "Rust",
  docs: {
    url: "https://solana.com/docs/intro/quick-start",
    name: "Solana",
    description: "The official Solana developer documentation.",
  },
  githubExample: {
    name: "Hello Solana",
    // Only import the program for now since `fs` and `os` modules are not
    // implemented in Playground. We could solve it by converting the code
    // where it reads the user keypair and the program keypair but the goal
    // is to make everything that works in a local Node environment work in
    // Playground without any modifications.
    //
    // TODO: Implement `fs` and `os` modules.
    // TODO: Also include tests after they are supported
    url: "https://github.com/solana-foundation/program-examples/tree/6d134a7a978dfe1c96b2b0e9602e029d0226596c/basics/hello-solana/native/program",
  },
  legacy: { version: "1.16.24" },
  getIsCurrent: (files) => {
    // Native dependencies and `entrypoint!` can be used by other frameworks too
    const matchesOther = PgFramework.all
      .filter((f) => f.name !== "Native")
      .some((f) => f.getIsCurrent(files));
    if (matchesOther) return false;
    return getIsCurrentCommon(files, ".rs", "entrypoint!");
  },
});
