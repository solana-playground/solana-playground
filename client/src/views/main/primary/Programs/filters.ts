import { TUTORIAL_CATEGORIES, TUTORIAL_FRAMEWORKS } from "../../../../utils/pg";

/** All program filters */
export const FILTERS = [
  {
    param: "framework",
    filters: TUTORIAL_FRAMEWORKS.filter((f) => f !== "Seahorse"),
  },
  {
    param: "categories",
    filters: TUTORIAL_CATEGORIES.filter((c) => c !== "Gaming"),
  },
] as const;
