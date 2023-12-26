import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
} from "../../utils/pg";

/** All program filters */
export const FILTERS = [
  {
    param: "framework",
    filters: TUTORIAL_FRAMEWORKS,
  },
  {
    param: "languages",
    filters: TUTORIAL_LANGUAGES,
  },
  {
    param: "categories",
    filters: TUTORIAL_CATEGORIES,
  },
] as const;
