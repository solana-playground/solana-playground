import { PgCommon, PgTheme } from "../../utils";
import { createSetting } from "../create";

export const ui = [
  createSetting({
    id: "ui.font",
    values: () => PgTheme.fonts.map((f) => f.family),
    getValue: () => PgTheme.font.family,
    setValue: (v) => PgTheme.set({ fontFamily: v }),
    onChange: PgTheme.onDidChangeFontFamily,
  }),
  createSetting({
    id: "ui.theme",
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
    onChange: PgTheme.onDidChangeThemeName,
  }),
];
