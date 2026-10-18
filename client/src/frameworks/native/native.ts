import { PgLanguage } from "../../utils";
import { createFramework } from "../create";

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
    // TODO: Implement `fs` and `os` modules.
    // url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native",
    url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native/program",
  },
  legacy: { version: "1.16.24" },
  getIsCurrent: (files) => {
    // TODO: Check `Cargo.toml`
    const rustContents = files
      .filter(([path]) => PgLanguage.getFromPath(path)?.name === "Rust")
      .map(([_, content]) => content);
    const hasSolanaProgram = rustContents.some((content) =>
      content.includes("solana_program")
    );
    if (!hasSolanaProgram) return false;

    const hasEntrypointMacro = rustContents.some((content) =>
      content.includes("entrypoint!")
    );
    return hasEntrypointMacro;
  },
});
