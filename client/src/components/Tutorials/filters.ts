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
  { param: "framework", filters: TUTORIAL_FRAMEWORKS },
  {
    param: "language",
    filters: TUTORIAL_LANGUAGES,
    tutorialKey: "languages",
  },
  // TODO: Enable once there are more tutorials with various categories
  // {
  //   param: "category",
  //   filters: TUTORIAL_CATEGORIES,
  //   tutorialKey: "categories",
  // },
] as const;

/** Tutorial search parameters */
export type FilterParam = typeof FILTERS[number]["param"];

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
