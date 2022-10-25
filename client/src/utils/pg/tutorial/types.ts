import { ComponentType } from "react";

type Author = {
  /** Author's name that will be displayed as one of the creators of the tutorial */
  name: string;
  /** Optional link to the author's page, e.g Twitter */
  link?: string;
};

export enum TutorialLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export enum TutorialCategory {
  DEFI = "DeFi",
  NFTS = "NFTs",
  PAYMENT = "Payment",
  STAKING = "Staking",
  OTHER = "Other",
}

export interface TutorialData {
  /** Tutorial name that will be shown in tutorials section */
  name: string;
  /** Tutorial description that will be shown in tutorials section */
  description: string;
  /** Tutorial cover image that will be shown in tutorials section */
  imageSrc: string;
  /** Authors of the tutorial */
  authors: Author[];
  /** Difficulty level of the tutorial */
  level: TutorialLevel;
  /** Category of the tutorial */
  category: TutorialCategory;
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
