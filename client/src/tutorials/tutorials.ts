import { TutorialData } from "../components/Tutorial";

const getTutorialImgSrc = (src: string) => "/tutorials/" + src;

export const TUTORIALS: TutorialData[] = [
  {
    name: "Template Tutorial",
    description: "Template Description...",
    imageSrc: getTutorialImgSrc("template/thumbnail.png"),
    elementImport: () => import("./Template"),
  },
];
