import { PgCommon } from "../utils/pg/common";
import type { ImportableTheme } from "../utils/pg";

/**
 * Create themes from the given names.
 *
 * Theme names are expected to be Title Case and the theme files are expected
 * to be kebab-case, e.g. if name is "My Theme", file name should be "my-theme.ts"
 *
 * @param names theme names
 * @returns the importable themes
 */
export const createThemes = (...names: string[]): ImportableTheme[] => {
  return names.map((name) => ({
    name,
    importTheme: () => import(`./themes/${PgCommon.toKebabFromTitle(name)}`),
  }));
};
