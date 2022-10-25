import { TutorialData } from "../utils/pg";

const getTutorialImgSrc = (src: string) => "/tutorials/" + src;

export const TUTORIALS: TutorialData[] = [
  {
    name: "Template Tutorial",
    description:
      "Anim officia deserunt aliquip et eu voluptate anim ea pariatur ipsum exercitation occaecat pariatur. Consectetur aute laboris sint fugiat pariatur dolore. Id labore cillum fugiat id amet eiusmod ad adipisicing occaecat incididunt. Tempor exercitation officia cupidatat exercitation mollit. Fugiat adipisicing in cupidatat esse tempor laborum in in mollit tempor laborum ea dolor et. Deserunt eu eiusmod minim aute sint reprehenderit.",
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    imageSrc: getTutorialImgSrc("template/thumbnail.png"),
    elementImport: () => import("./Template"),
  },
];
