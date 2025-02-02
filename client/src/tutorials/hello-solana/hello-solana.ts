import { createTutorial } from "../create";

export const helloSolana = createTutorial({
  name: "Hello Solana",
  description: "Hello world program with Native Solana/Rust.",
  authors: [{ name: "acheron", link: "https://twitter.com/acheroncrypto" }],
  level: "Beginner",
  framework: "Native",
  languages: ["Rust", "TypeScript"],
});
