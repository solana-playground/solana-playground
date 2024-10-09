import {
  TutorialLevel,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "../../../../utils/pg";

/** All tutorial filters */
export const FILTERS = [
  {
    param: "level",
    filters: TUTORIAL_LEVELS,
    sortFn: sortByLevel,
  },
  {
    param: "framework",
    filters: TUTORIAL_FRAMEWORKS,
  },
  {
    param: "languages",
    filters: TUTORIAL_LANGUAGES,
  },
  // TODO: Enable once there are more tutorials with various categories
  // {
  //   param: "categories",
  //   filters: TUTORIAL_CATEGORIES,
  // },
] as const;

/** Sort based on `TutorialLevel`. */
export function sortByLevel<T extends { level: TutorialLevel }>(a: T, b: T) {
  return TUTORIAL_LEVELS.indexOf(a.level) - TUTORIAL_LEVELS.indexOf(b.level);
}
