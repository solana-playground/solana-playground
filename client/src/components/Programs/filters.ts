import {
  Arrayable,
  PgCommon,
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

/**
 * Filter the query based on the search values and the program values.
 *
 * @param searchValues values in the URL
 * @param programValues values declared for the program
 * @returns whether the program passes the checks
 */
export const filterQuery = (
  searchValues: Arrayable<string>,
  programValues: Arrayable<string> = []
) => {
  searchValues = PgCommon.toArray(searchValues);
  programValues = PgCommon.toArray(programValues);
  return (
    !searchValues.length ||
    (!!programValues.length &&
      searchValues.some((v) => programValues.includes(v)))
  );
};
