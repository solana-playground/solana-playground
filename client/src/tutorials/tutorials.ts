import {
  TutorialCategory,
  TutorialData,
  TutorialLevel,
} from "../utils/pg/tutorial/types";

const getTutorialImgSrc = (src: string) => "/tutorials/" + src;

export const TUTORIALS: TutorialData[] = [
  {
    name: "Hello Solana",
    description: "Hello world program with Native Solana/Rust.",
    imageSrc: getTutorialImgSrc("hello-solana/thumbnail.jpg"),
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.NATIVE],
    elementImport: () => import("./HelloSolana"),
  },

  {
    name: "Hello Anchor",
    description: "Hello world program with Anchor framework.",
    imageSrc: getTutorialImgSrc("hello-anchor/thumbnail.jpg"),
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.ANCHOR],
    elementImport: () => import("./HelloAnchor"),
  },

  {
    name: "Hello Seahorse",
    description: "Hello world program with Seahorse framework in Python.",
    imageSrc: getTutorialImgSrc("hello-seahorse/thumbnail.jpg"),
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.SEAHORSE],
    elementImport: () => import("./HelloSeahorse"),
  },

  {
    name: "Counter PDA Tutorial",
    description:
      "Create a simple counter that will store the number of times is called.",
    imageSrc: getTutorialImgSrc("counter-easy/counter.jpg"),
    authors: [
      {
        name: "cleon",
        link: "https://twitter.com/0xCleon",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.ANCHOR],
    elementImport: () => import("./CounterEasy"),
  },

  {
    name: "Tiny Adventure",
    description:
      "Create a very simple on chain game. Moving a character left and right. Will be connected to Unity Game Engine later on.",
    imageSrc: getTutorialImgSrc("tiny-adventure/tinyAdventure.jpg"),
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.ANCHOR, TutorialCategory.GAMING],
    elementImport: () => import("./TinyAdventure"),
  },

  {
    name: "Tiny Adventure Two",
    description: "Giving out SOL rewards to players.",
    imageSrc: getTutorialImgSrc("tiny-adventure-two/tinyAdventureTwo.jpg"),
    authors: [
      {
        name: "Jonas Hahn",
        link: "https://twitter.com/solplay_jonas",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.ANCHOR, TutorialCategory.GAMING],
    elementImport: () => import("./TinyAdventureTwo"),
  },

  {
    name: "Battle Coins",
    description:
      "Learn to create a token mint with metadata, mint tokens, and burn tokens. Defeat enemies to earn tokens and restore your health by burning tokens.",
    imageSrc: getTutorialImgSrc("battle-coins/battleCoins.jpg"),
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
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.ANCHOR, TutorialCategory.GAMING],
    elementImport: () => import("./BattleCoins"),
  },
];
