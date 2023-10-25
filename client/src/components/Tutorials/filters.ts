import {
  Arrayable,
  PgCommon,
  TutorialLevel,
  TUTORIAL_CATEGORIES,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "../../utils/pg";

export const SEARCH_QUERY = "search";
export const LEVEL_QUERY = "level";
export const FRAMEWORK_QUERY = "framework";
export const LANGUAGE_QUERY = "language";
export const CATEGORY_QUERY = "category";

export const FILTERS = [
  {
    query: LEVEL_QUERY,
    filters: TUTORIAL_LEVELS,
    sortFn: sortByLevel,
  },
  { query: FRAMEWORK_QUERY, filters: TUTORIAL_FRAMEWORKS },
  { query: LANGUAGE_QUERY, filters: TUTORIAL_LANGUAGES },
  { query: CATEGORY_QUERY, filters: TUTORIAL_CATEGORIES },
] as const;

export type FilterQuery = typeof FILTERS[number]["query"];

export const filterQuery = (
  queries: Arrayable<string>,
  values: Arrayable<string> = []
) => {
  queries = PgCommon.toArray(queries);
  values = PgCommon.toArray(values);
  return (
    !queries.length ||
    (values.length && queries.some((l) => values.includes(l as any)))
  );
};

export function sortByLevel(a: string, b: string) {
  return (
    TUTORIAL_LEVELS.indexOf(a as TutorialLevel) -
    TUTORIAL_LEVELS.indexOf(b as TutorialLevel)
  );
}
