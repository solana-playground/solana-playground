import type { ComponentType } from "react";

import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "./details";
import type { Nullable, RequiredKey } from "../types";

type Author = {
  /** Author's name that will be displayed as one of the creators of the tutorial */
  name: string;
  /** Optional link to the author's page, e.g Twitter, Github */
  link?: string;
};

/** Program info state */
export type TutorialState = Nullable<
  TutorialMetadata & { view: "about" | "main"; data: TutorialData }
>;

/** Serialized program info that's used in storage */
export type SerializedTutorialState = Nullable<TutorialMetadata>;

/** Tutorial data with optional fields. */
export interface TutorialDataInit {
  /** Tutorial name that will be shown in tutorials section */
  name: string;
  /**
   * Tutorial description that will be shown in tutorials section.
   *
   * Only the first 72 characters will be shown in the tutorials page.
   */
  description: string;
  /** Authors of the tutorial */
  authors: Author[];
  /** Difficulty level of the tutorial */
  level: TutorialLevel;
  /** Solana program framework */
  framework?: TutorialFramework;
  /** Programming languages used in the tutorial */
  languages?: TutorialLanguage[];
  /** Category of the tutorial. Can specify up to 3 categories. */
  categories?: TutorialCategory[];
  /** Whether the tutorial is featured */
  featured?: boolean;
  /**
   * Tutorial cover image that will be shown in tutorials section.
   *
   * It can either be `/tutorials/...` or full url to the image.
   *
   * Thumbnails are displayed at 4:3 aspect ratio(278x216).
   *
   * Defaults to `/tutorials/<tutorial-name>/thumbnail.*`.
   */
  thumbnail?: string;
  /**
   * Tutorial component async import.
   *
   * Defaults to `./<TutorialName>`.
   */
  elementImport?: () => Promise<{
    default: ComponentType<Omit<TutorialData, "elementImport">>;
  }>;
}

/** Tutorial data with optional fields filled with defaults. */
export type TutorialData = RequiredKey<
  TutorialDataInit,
  "thumbnail" | "elementImport"
>;

export interface TutorialMetadata {
  /** Current page number */
  pageNumber: number;
  /** Total page amount of the tutorial */
  pageCount: number;
  /** Whether the tutorial has been completed */
  completed: boolean;
}

export type TutorialLevel = typeof TUTORIAL_LEVELS[number];
export type TutorialFramework = typeof TUTORIAL_FRAMEWORKS[number];
export type TutorialLanguage = typeof TUTORIAL_LANGUAGES[number];
export type TutorialCategory = typeof TUTORIAL_CATEGORIES[number];

export type TutorialDetailKey = keyof Pick<
  TutorialData,
  "level" | "framework" | "languages" | "categories"
>;
