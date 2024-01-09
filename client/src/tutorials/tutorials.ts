import { createTutorials } from "./create";

/** All visible tutorials at `/tutorials`(in order) */
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
  },

  {
    name: "Counter PDA Tutorial",
    description:
      "Create a simple counter that will store the number of times is called.",
    authors: [
      {
        name: "cleon",
        link: "https://twitter.com/0xCleon",
      },
    ],
    level: "Beginner",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    thumbnail: "counter-easy/thumbnail.jpg",
    elementImport: () => import("./CounterEasy"),
  },

  {
    name: "Tiny Adventure",
    description:
      "Create a very simple on chain game. Moving a character left and right. Will be connected to Unity Game Engine later on.",

    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: "Beginner",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    categories: ["Gaming"],
  },

  {
    name: "Tiny Adventure Two",
    description: "Giving out SOL rewards to players.",
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: "Beginner",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    categories: ["Gaming"],
  },

  {
    name: "Zero Copy",
    description: "How to handle memory and big accounts.",
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: "Advanced",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
  },

  {
    name: "Lumberjack",
    description: "How to build and energy system on chain.",
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: "Intermediate",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    categories: ["Gaming"],
  },

  {
    name: "Battle Coins",
    description:
      "Learn to create a token mint with metadata, mint tokens, and burn tokens. Defeat enemies to earn tokens and restore your health by burning tokens.",
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
      {
        name: "John",
        link: "https://twitter.com/ZYJLiu",
      },
    ],
    level: "Intermediate",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    categories: ["Gaming"],
  },

  {
    name: "Boss Battle",
    description:
      "How to use XORShift random number generator in an onchain game. Spawn and attack an enemy boss, dealing pseudo-random damage utilizing the current slot as a source of randomness.",
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
      {
        name: "John",
        link: "https://twitter.com/ZYJLiu",
      },
    ],
    level: "Intermediate",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
    categories: ["Gaming"],
  },

  {
    name: "Expense Tracker",
    description:
      "Learn how to create an expense tracker app and understand PDAs",
    authors: [
      {
        name: "Bolt / Syed Aabis Akhtar",
        link: "https://twitter.com/0xBolt",
      },
    ],
    level: "Beginner",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
  },

  {
    name: "Bank Simulator",
    description:
      "Learn on-chain automation by creating bank program with interest returns.",
    authors: [
      {
        name: "Bolt / Syed Aabis Akhtar",
        link: "https://twitter.com/0xBolt",
      },
    ],
    level: "Intermediate",
    framework: "Anchor",
    languages: ["Rust", "TypeScript"],
  }
);
