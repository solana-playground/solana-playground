import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { ThemeProvider } from "styled-components";

import THEMES from "./themes";
import FONTS from "./fonts";
import Theme, { Font } from "./interface";
import {
  PG_BORDER_RADIUS,
  PG_SCROLLBAR,
  PG_TRANSITION,
  PG_TRANSPARENCY,
} from "./default";

export const THEME_KEY = "_theme";
export const FONT_KEY = "font";

interface MutThemeContextProps {
  setTheme: Dispatch<SetStateAction<Theme>>;
  font: Font;
  setFont: Dispatch<SetStateAction<Font>>;
}
export const MutThemeContext = createContext<MutThemeContextProps>(
  {} as MutThemeContextProps
);

const MutThemeProvider: FC = ({ children }) => {
  const themeName = localStorage.getItem(THEME_KEY);
  const fontFamily = localStorage.getItem(FONT_KEY);
  const _theme = THEMES.find((t) => t.name === themeName) ?? THEMES[0];
  const _font = FONTS.find((f) => f.family === fontFamily) ?? FONTS[0];

  // Set defaults
  if (!_theme.transparency) _theme.transparency = PG_TRANSPARENCY;
  if (!_theme.colors.right?.bg)
    _theme.colors.right = {
      ..._theme.colors.right,
      bg: _theme.colors.default.bg,
    };
  if (!_theme.colors.right?.otherBg)
    _theme.colors.right = {
      ..._theme.colors.right,
      otherBg: _theme.colors.default.bg,
    };
  if (!_theme.colors.tooltip)
    _theme.colors.tooltip = {
      bg: _theme.colors.default.bg,
      color: _theme.colors.default.textPrimary,
    };
  if (!_theme.borderRadius) _theme.borderRadius = PG_BORDER_RADIUS;
  if (!_theme.colors.scrollbar) {
    if (_theme.isDark) _theme.colors.scrollbar = PG_SCROLLBAR.dark;
    else _theme.colors.scrollbar = PG_SCROLLBAR.light;
  }
  if (!_theme.transition) _theme.transition = PG_TRANSITION;

  const [theme, setTheme] = useState(_theme);
  const [font, setFont] = useState(_font);

  // Update theme.font when theme or font changes
  useEffect(() => {
    if (theme && theme.font !== font) setTheme((t) => ({ ...t, font }));
  }, [theme, font, setTheme]);

  return (
    <MutThemeContext.Provider value={{ setTheme, font, setFont }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MutThemeContext.Provider>
  );
};

export default MutThemeProvider;
