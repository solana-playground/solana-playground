import { PgFramework, PgLanguage, TUTORIAL_LEVELS } from "../../../../utils/pg";

/** All tutorial filters */
export const FILTERS = [
  {
    param: "level",
    filters: TUTORIAL_LEVELS,
  },
  {
    param: "framework",
    filters: PgFramework.all.map((f) => f.name),
  },
  {
    param: "languages",
    filters: PgLanguage.all.map((lang) => lang.name),
  },
  // TODO: Enable once there are more tutorials with various categories
  // {
  //   param: "categories",
  //   filters: TUTORIAL_CATEGORIES,
  // },
] as const;
