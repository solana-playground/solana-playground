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
import { Font, PgTheme } from "./interface";
import {
  PG_BORDER_RADIUS,
  PG_BOX_SHADOW,
  PG_FONT_OTHER,
  PG_SCROLLBAR,
  PG_SKELETON,
  PG_TRANSITION,
  PG_TRANSPARENCY,
} from "./default";

export const THEME_KEY = "theme";
export const FONT_KEY = "font";

interface MutThemeContextProps {
  setTheme: Dispatch<SetStateAction<PgTheme>>;
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

  /// Set defaults
  // Transparency
  if (!_theme.transparency) _theme.transparency = PG_TRANSPARENCY;

  // State
  if (!_theme.colors.state.disabled.bg)
    _theme.colors.state.disabled.bg =
      _theme.colors.state.disabled.color + _theme.transparency.low;
  if (!_theme.colors.state.error.bg)
    _theme.colors.state.error.bg =
      _theme.colors.state.error.color + _theme.transparency.low;
  if (!_theme.colors.state.hover.bg)
    _theme.colors.state.hover.bg =
      _theme.colors.state.hover.color + _theme.transparency.low;
  if (!_theme.colors.state.info.bg)
    _theme.colors.state.info.bg =
      _theme.colors.state.info.color + _theme.transparency.low;
  if (!_theme.colors.state.success.bg)
    _theme.colors.state.success.bg =
      _theme.colors.state.success.color + _theme.transparency.low;
  if (!_theme.colors.state.warning.bg)
    _theme.colors.state.warning.bg =
      _theme.colors.state.warning.color + _theme.transparency.low;

  // Border radius
  if (!_theme.borderRadius) _theme.borderRadius = PG_BORDER_RADIUS;

  // Box shadow
  if (!_theme.boxShadow) _theme.boxShadow = PG_BOX_SHADOW;

  // Input
  if (!_theme.colors.input) _theme.colors.input = {};
  if (!_theme.colors.input.bg)
    _theme.colors.input.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.input.borderColor)
    _theme.colors.input.borderColor = _theme.colors.default.borderColor;
  if (!_theme.colors.input.color)
    _theme.colors.input.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.input.outlineColor)
    _theme.colors.input.outlineColor =
      _theme.colors.default.primary + _theme.transparency!.medium;

  // Right sidebar
  if (!_theme.colors.right) _theme.colors.right = {};
  if (!_theme.colors.right?.bg)
    _theme.colors.right.bg = _theme.colors.default.bgSecondary;
  if (!_theme.colors.right?.otherBg)
    _theme.colors.right.otherBg = _theme.colors.default.bgPrimary;

  // Editor
  if (!_theme.colors.editor) _theme.colors.editor = {};
  if (!_theme.colors.editor.bg)
    _theme.colors.editor.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.editor.color)
    _theme.colors.editor.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.editor.cursorColor)
    _theme.colors.editor.cursorColor = _theme.colors.default.textSecondary;

  // Active line
  if (!_theme.colors.editor.activeLine) _theme.colors.editor.activeLine = {};
  if (!_theme.colors.editor.activeLine.bg)
    _theme.colors.editor.activeLine.bg = "inherit";
  if (!_theme.colors.editor.activeLine.borderColor)
    _theme.colors.editor.activeLine.borderColor =
      _theme.colors.default.borderColor;

  // Selection
  if (!_theme.colors.editor?.selection) _theme.colors.editor.selection = {};
  if (!_theme.colors.editor.selection.bg)
    _theme.colors.editor.selection.bg =
      _theme.colors.default.primary + _theme.transparency!.medium;
  if (!_theme.colors.editor.selection.color)
    _theme.colors.editor.selection.color = "inherit";

  // Search match
  if (!_theme.colors.editor?.searchMatch) _theme.colors.editor.searchMatch = {};
  if (!_theme.colors.editor.searchMatch.bg)
    _theme.colors.editor.searchMatch.bg =
      _theme.colors.default.textSecondary + _theme.transparency!.medium;
  if (!_theme.colors.editor.searchMatch.color)
    _theme.colors.editor.searchMatch.color = "inherit";
  if (!_theme.colors.editor.searchMatch.selectedBg)
    _theme.colors.editor.searchMatch.selectedBg = "inherit";
  if (!_theme.colors.editor.searchMatch.selectedColor)
    _theme.colors.editor.searchMatch.selectedColor = "inherit";
  // Gutter
  if (!_theme.colors.editor?.gutter) _theme.colors.editor.gutter = {};
  if (!_theme.colors.editor.gutter.bg)
    _theme.colors.editor.gutter.bg = _theme.colors.editor.bg;
  if (!_theme.colors.editor.gutter.color)
    _theme.colors.editor.gutter.color = _theme.colors.default.textSecondary;

  // Tooltip/dropdown
  if (!_theme.colors.editor?.tooltip) _theme.colors.editor.tooltip = {};
  if (!_theme.colors.editor.tooltip.bg)
    _theme.colors.editor.tooltip.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.editor.tooltip.color)
    _theme.colors.editor.tooltip.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.editor.tooltip.selectedBg)
    _theme.colors.editor.tooltip.selectedBg =
      _theme.colors.default.primary + _theme.transparency?.medium;
  if (!_theme.colors.editor.tooltip.selectedColor)
    _theme.colors.editor.tooltip.selectedColor =
      _theme.colors.default.textPrimary;

  // Home
  if (!_theme.colors.home) _theme.colors.home = {};
  if (!_theme.colors.home.bg)
    _theme.colors.home.bg = _theme.colors.default.bgSecondary;
  if (!_theme.colors.home.color)
    _theme.colors.home.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.home.card) _theme.colors.home.card = {};
  if (!_theme.colors.home.card.bg)
    _theme.colors.home.card.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.home.card.color)
    _theme.colors.home.card.color = _theme.colors.default.textPrimary;

  // Markdown
  if (!_theme.colors.markdown) _theme.colors.markdown = {};
  if (!_theme.colors.markdown.bg)
    _theme.colors.markdown.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.markdown.color)
    _theme.colors.markdown.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.markdown.code) _theme.colors.markdown.code = {};
  if (!_theme.colors.markdown.code.bg)
    _theme.colors.markdown.code.bg = _theme.colors.default.bgSecondary;
  if (!_theme.colors.markdown.code.color)
    _theme.colors.markdown.code.color = _theme.colors.default.textPrimary;

  // Terminal
  if (!_theme.colors.terminal)
    _theme.colors.terminal = {
      bg: _theme.colors.default.bgPrimary,
      color: _theme.colors.default.textPrimary,
      cursorColor: _theme.colors.default.textPrimary,
      selectionBg: _theme.colors.default.textSecondary,
    };

  // Tooltip
  if (!_theme.colors.tooltip)
    _theme.colors.tooltip = {
      bg: _theme.colors.default.bgPrimary,
      color: _theme.colors.default.textPrimary,
    };

  // Tutorial
  if (!_theme.colors.tutorial) _theme.colors.tutorial = {};
  if (!_theme.colors.tutorial.bg)
    _theme.colors.tutorial.bg = _theme.colors.default.bgSecondary;
  if (!_theme.colors.tutorial.color)
    _theme.colors.tutorial.color = _theme.colors.default.textPrimary;

  // Tutorials
  if (!_theme.colors.tutorials) _theme.colors.tutorials = {};
  if (!_theme.colors.tutorials.bg)
    _theme.colors.tutorials.bg = _theme.colors.default.bgSecondary;
  if (!_theme.colors.tutorials.color)
    _theme.colors.tutorials.color = _theme.colors.default.textPrimary;
  if (!_theme.colors.tutorials.card) _theme.colors.tutorials.card = {};
  if (!_theme.colors.tutorials.card.bg)
    _theme.colors.tutorials.card.bg = _theme.colors.default.bgPrimary;
  if (!_theme.colors.tutorials.card.color)
    _theme.colors.tutorials.card.color = _theme.colors.default.textPrimary;

  // Scrollbar
  if (!_theme.scrollbar) {
    if (_theme.isDark) _theme.scrollbar = PG_SCROLLBAR.dark;
    else _theme.scrollbar = PG_SCROLLBAR.light;
  }

  // Skeleton
  if (!_theme.skeleton) _theme.skeleton = PG_SKELETON;

  // Transition
  if (!_theme.transition) _theme.transition = PG_TRANSITION;

  const [theme, setTheme] = useState(_theme);
  const [font, setFont] = useState(_font);

  // Update theme.font when theme or font changes
  useEffect(() => {
    if (theme && theme.font?.code !== font) {
      setTheme((t) => ({ ...t, font: { code: font, other: PG_FONT_OTHER } }));
    }
  }, [theme, font, setTheme]);

  return (
    <MutThemeContext.Provider value={{ setTheme, font, setFont }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MutThemeContext.Provider>
  );
};

export default MutThemeProvider;
