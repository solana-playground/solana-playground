import { PgCommon, PgTheme } from "../../utils/pg";
import { createSetting } from "../create";

export const ui = [
  createSetting({
    name: "Font",
    values: () => PgTheme.fonts.map((f) => f.family),
    getValue: () => PgTheme.font.family,
    setValue: (v) => PgTheme.set({ fontFamily: v }),
    // `onChange` isn't necessary because the whole app re-renders on font change
  }),
  createSetting({
    name: "Theme",
    values: () => {
      const [darkThemes, lightThemes] = PgCommon.filterWithRemaining(
        PgTheme.themes,
        (t) => t.isDark
      );
      return [
        { name: "Dark", values: darkThemes.map((t) => t.name) },
        { name: "Light", values: lightThemes.map((t) => t.name) },
      ];
    },
    getValue: () => PgTheme.theme.name,
    setValue: (v) => PgTheme.set({ themeName: v }),
    // `onChange` isn't necessary because the whole app re-renders on theme change
  }),
];
