import { createContext, Dispatch, FC, SetStateAction, useState } from "react";
import { ThemeProvider } from "styled-components";

import {
  PG_BORDER_RADIUS,
  PG_FONT,
  PG_SCROLLBAR,
  PG_TRANSITION,
  PG_TRANSPARENCY,
} from "./default";
import Theme from "./interface";
import THEMES from "./themes";
import { DRACULA } from "./themes/";

export const THEME_KEY = "theme";

interface MutThemeContextProps {
  setTheme: Dispatch<SetStateAction<Theme>>;
}
export const MutThemeContext = createContext<MutThemeContextProps>(
  {} as MutThemeContextProps
);

const MutThemeProvider: FC = ({ children }) => {
  const themeName = localStorage.getItem(THEME_KEY);
  const theme = THEMES.find((t) => t.name === themeName) ?? DRACULA;

  // Set defaults
  if (!theme.font) theme.font = PG_FONT;
  if (!theme.transparency) theme.transparency = PG_TRANSPARENCY;
  // Change bg in each item
  if (!theme.colors.right?.bg)
    theme.colors.right = {
      ...theme.colors.right,
      bg: theme.colors.default.bg,
    };
  if (!theme.colors.right?.otherBg)
    theme.colors.right = {
      ...theme.colors.right,
      otherBg: theme.colors.default.bg,
    };
  if (!theme.colors.tooltip)
    theme.colors.tooltip = {
      bg: theme.colors.default.bg,
      color: theme.colors.default.textPrimary,
    };
  if (!theme.borderRadius) theme.borderRadius = PG_BORDER_RADIUS;
  if (!theme.colors.scrollbar) {
    if (theme.isDark) theme.colors.scrollbar = PG_SCROLLBAR.dark;
    else theme.colors.scrollbar = PG_SCROLLBAR.light;
  }
  if (!theme.transition) theme.transition = PG_TRANSITION;

  const [_theme, setTheme] = useState(theme);

  return (
    <MutThemeContext.Provider value={{ setTheme }}>
      <ThemeProvider theme={_theme}>{children}</ThemeProvider>
    </MutThemeContext.Provider>
  );
};

export default MutThemeProvider;
