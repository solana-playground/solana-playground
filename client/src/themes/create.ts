import { PgCommon } from "../utils/pg/common";
import type { ImportableTheme, ImportableThemeParam } from "../utils/pg";

/**
 * Create a theme with lazy loading support.
 *
 * `theme.name` is expected to be Title Case and a separate directory is
 * expected with kebab-case name, e.g. if the name is "My Theme", directory
 * name should be "my-theme".
 *
 * @param theme theme to create
 * @returns the importable theme (with async imports)
 */
export const createTheme = (theme: ImportableThemeParam) => {
  theme.isDark ??= false;
  theme.importTheme ??= () =>
    import(`./${PgCommon.toKebabFromTitle(theme.name)}/theme`);
  return theme as ImportableTheme;
};
