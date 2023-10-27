import {
  Arrayable,
  PgCommon,
  TutorialLevel,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "../../utils/pg";

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

/**
 * Filter the query based on the search values and the tutorial values.
 *
 * @param searchValues values in the URL
 * @param tutorialValues values declared for the tutorial
 * @returns whether the tutorial passes the checks
 */
export const filterQuery = (
  searchValues: Arrayable<string>,
  tutorialValues: Arrayable<string> = []
) => {
  searchValues = PgCommon.toArray(searchValues);
  tutorialValues = PgCommon.toArray(tutorialValues);
  return (
    !searchValues.length ||
    (!!tutorialValues.length &&
      searchValues.some((l) => tutorialValues.includes(l as any)))
  );
};

/** Sort based on `TutorialLevel`. */
export function sortByLevel(a: string, b: string) {
  return (
    TUTORIAL_LEVELS.indexOf(a as TutorialLevel) -
    TUTORIAL_LEVELS.indexOf(b as TutorialLevel)
  );
}
