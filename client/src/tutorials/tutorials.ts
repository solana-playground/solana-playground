import {
  TutorialCategory,
  TutorialData,
  TutorialLevel,
} from "../utils/pg/tutorial/types";

const getTutorialImgSrc = (src: string) => "/tutorials/" + src;

export const TUTORIALS: TutorialData[] = [
  {
    name: "Template Tutorial",
    description: "Simple template tutorial.",
    imageSrc: getTutorialImgSrc("template/thumbnail.png"),
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.OTHER],
    elementImport: () => import("./Template"),
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
    categories: [TutorialCategory.OTHER],
    elementImport: () => import("./Template_counter"),
  },
];
