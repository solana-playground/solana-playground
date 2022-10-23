import { TutorialData } from "../components/Tutorial";

const getTutorialImgSrc = (src: string) => "/tutorials/" + src;

export const TUTORIALS: TutorialData[] = [
  {
    name: "Template Tutorial",
    description:
      "You may receive _warning_ when your program is compiled due to unused variables. Don't worry, these warning will not affect your build. They are due to our very simple program not using all the variables we declared in the `process_instruction` function.",
    imageSrc: getTutorialImgSrc("template/thumbnail.png"),
    elementImport: () => import("./Template"),
  },
];
