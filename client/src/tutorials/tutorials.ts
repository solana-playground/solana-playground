import { createTutorials } from "./create";

/** All visible non-Markdown tutorials at `/tutorials`(in order) */
export const TUTORIALS = createTutorials(
  {
    name: "Hello Solana",
    description: "Hello world program with Native Solana/Rust.",
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: "Beginner",
    framework: "Native",
    languages: ["Rust", "TypeScript"],
  },

  {
    name: "Hello Anchor",
    description: "Hello world program with Anchor framework.",
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: "Beginner",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
  },

  {
    name: "Hello Seahorse",
    description: "Hello world program with Seahorse framework in Python.",
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: "Beginner",
    framework: "Seahorse",
    languages: ["Python", "TypeScript"],
  }
);
