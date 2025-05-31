import { PgFramework, TUTORIAL_CATEGORIES } from "../../../../utils/pg";

/** All program filters */
export const FILTERS = [
  {
    param: "framework",
    filters: PgFramework.all.map((f) => f.name),
  },
  {
    param: "categories",
    filters: TUTORIAL_CATEGORIES,
  },
] as const;
