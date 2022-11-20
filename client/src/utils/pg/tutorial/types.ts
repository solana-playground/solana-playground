import { ComponentType } from "react";

export enum TutorialLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export enum TutorialCategory {
  DEFI = "DeFi",
  NFT = "NFT",
  PAYMENT = "Payment",
  STAKING = "Staking",
  GAMING = "Gaming",
  NATIVE = "Native",
  ANCHOR = "Anchor",
  SEAHORSE = "Seahorse",
  JAVASCRIPT = "JS",
  TYPESCRIPT = "TS",
  OTHER = "Other",
}

type Author = {
  /** Author's name that will be displayed as one of the creators of the tutorial */
  name: string;
  /** Optional link to the author's page, e.g Twitter, Github */
  link?: string;
};

export interface TutorialData {
  /** Tutorial name that will be shown in tutorials section */
  name: string;
  /** Tutorial description that will be shown in tutorials section.
   * Only the first 72 characters will be shown in the tutorials page.
   */
  description: string;
  /** Tutorial cover image that will be shown in tutorials section.
   * It can either be `/tutorials/...` or full url to the image.
   */
  imageSrc: string;
  /** Authors of the tutorial */
  authors: Author[];
  /** Difficulty level of the tutorial */
  level: TutorialLevel;
  /** Category of the tutorial. Can specify up to 3 categories. */
  categories: TutorialCategory[];
  /** Tutorial component async import */
  elementImport: () => Promise<{
    default: ComponentType<Omit<TutorialData, "elementImport">>;
  }>;
}

export interface TutorialMetadata {
  /** Current page number */
  pageNumber: number;
  /** Total page amount of the tutorial */
  pageCount: number;
  /** Whether the tutorial has been completed */
  completed?: boolean;
}
