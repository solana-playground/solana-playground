import { EventName } from "../../../constants";
import { PgCommon } from "../common";
import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_BOX_SHADOW,
  DEFAULT_FONT_OTHER,
  DEFAULT_SCROLLBAR,
  DEFAULT_SKELETON,
  DEFAULT_TRANSITION,
  DEFAULT_TRANSPARENCY,
} from "./default";
import { PgFont, PgTheme } from "./interface";

export class PgThemeManager {
  /** Current theme */
  private static _theme: PgTheme;

  /** Current font */
  private static _font: PgFont;

  /**
   * Create a theme from `localStorage`.
   *
   * This function is also responsible for setting sensible defaults.
   *
   * @param themes themes to match against `localStorage`
   * @param fonts fonts to match against `localStorage`
   * @returns the theme and font
   */
  static create(themes: PgTheme[], fonts: PgFont[]) {
    const themeName = localStorage.getItem(this._THEME_KEY);
    const fontFamily = localStorage.getItem(this._FONT_KEY);
    const theme = themes.find((t) => t.name === themeName) ?? themes[0];
    const font = fonts.find((f) => f.family === fontFamily) ?? fonts[0];

    this._theme = theme;
    this._font = font;

    // Set defaults(order matters)
    this._fonts()
      ._transparency()
      ._borderRadius()
      ._boxShadow()
      ._scrollbar()
      ._transition()
      ._stateColors()
      ._components()
      ._button()
      ._menu()
      ._input()
      ._select()
      ._markdown()
      ._skeleton()
      ._tooltip()
      ._sidebarRight()
      ._editor()
      ._home()
      ._terminal()
      ._tutorial()
      ._tutorials();

    return { theme, font };
  }

  /** Set new theme */
  static setTheme(newTheme: PgTheme) {
    if (this._theme.name === newTheme.name) return;

    localStorage.setItem(this._THEME_KEY, newTheme.name);
    PgCommon.createAndDispatchCustomEvent(EventName.THEME_SET, newTheme);
  }

  /** Set new font */
  static setFont(newFont: PgFont) {
    localStorage.setItem(this._FONT_KEY, newFont.family);
    PgCommon.createAndDispatchCustomEvent(EventName.THEME_FONT_SET, newFont);
  }

  /** Set default transparency */
  private static _transparency() {
    if (!this._theme.transparency) {
      this._theme.transparency = DEFAULT_TRANSPARENCY;
    }
    return this;
  }

  /** Set default borderRadius */
  private static _borderRadius() {
    if (!this._theme.borderRadius) {
      this._theme.borderRadius = DEFAULT_BORDER_RADIUS;
    }
    return this;
  }

  /** Set default boxShadow */
  private static _boxShadow() {
    if (!this._theme.boxShadow) {
      this._theme.boxShadow = DEFAULT_BOX_SHADOW;
    }
    return this;
  }

  /** Set default scrollbar */
  private static _scrollbar() {
    if (!this._theme.scrollbar) {
      if (this._theme.isDark) this._theme.scrollbar = DEFAULT_SCROLLBAR.dark;
      else this._theme.scrollbar = DEFAULT_SCROLLBAR.light;
    }
    return this;
  }

  /** Set default transition */
  private static _transition() {
    if (!this._theme.transition) {
      this._theme.transition = DEFAULT_TRANSITION;
    }
    return this;
  }

  /** Set default state colors */
  private static _stateColors() {
    if (!this._theme.colors.state.disabled.bg) {
      this._theme.colors.state.disabled.bg =
        this._theme.colors.state.disabled.color + this._theme.transparency!.low;
    }
    if (!this._theme.colors.state.error.bg) {
      this._theme.colors.state.error.bg =
        this._theme.colors.state.error.color + this._theme.transparency!.low;
    }
    if (!this._theme.colors.state.hover.bg) {
      this._theme.colors.state.hover.bg =
        this._theme.colors.state.hover.color + this._theme.transparency!.low;
    }
    if (!this._theme.colors.state.info.bg) {
      this._theme.colors.state.info.bg =
        this._theme.colors.state.info.color + this._theme.transparency!.low;
    }
    if (!this._theme.colors.state.success.bg) {
      this._theme.colors.state.success.bg =
        this._theme.colors.state.success.color + this._theme.transparency!.low;
    }
    if (!this._theme.colors.state.warning.bg) {
      this._theme.colors.state.warning.bg =
        this._theme.colors.state.warning.color + this._theme.transparency!.low;
    }

    return this;
  }

  /** Set default components */
  private static _components() {
    if (!this._theme.components) {
      this._theme.components = {};
    }
    return this;
  }

  /** Set default button component */
  private static _button() {
    if (!this._theme.components!.button) {
      this._theme.components!.button = {};
    }

    if (!this._theme.components!.button.default) {
      this._theme.components!.button.default = {};
    }
    if (!this._theme.components!.button.default.bg) {
      this._theme.components!.button.default.bg = "transparent";
    }
    if (!this._theme.components!.button.default.color) {
      this._theme.components!.button.default.color = "inherit";
    }
    if (!this._theme.components!.button.default.borderColor) {
      this._theme.components!.button.default.borderColor = "transparent";
    }
    if (!this._theme.components!.button.default.borderRadius) {
      this._theme.components!.button.default.borderRadius =
        this._theme.borderRadius;
    }
    if (!this._theme.components!.button.default.padding) {
      this._theme.components!.button.default.padding = "";
    }
    if (!this._theme.components!.button.default.boxShadow) {
      this._theme.components!.button.default.boxShadow = "none";
    }
    if (!this._theme.components!.button.default.outline) {
      this._theme.components!.button.default.outline = "none";
    }
    if (!this._theme.components!.button.default.fontSize) {
      this._theme.components!.button.default.fontSize =
        this._theme.font?.code?.size.medium;
    }
    if (!this._theme.components!.button.default.fontWeight) {
      this._theme.components!.button.default.fontWeight = "normal";
    }
    if (!this._theme.components!.button.default.hover) {
      this._theme.components!.button.default.hover = {};
    }

    return this;
  }

  /** Set default menu component */
  private static _menu() {
    if (!this._theme.components!.menu) {
      this._theme.components!.menu = {};
    }

    if (!this._theme.components!.menu.default) {
      this._theme.components!.menu.default = {};
    }
    if (!this._theme.components!.menu.default.bg) {
      this._theme.components!.menu.default.bg =
        this._theme.colors?.right?.otherBg;
    }
    if (!this._theme.components!.menu.default.color) {
      this._theme.components!.menu.default.color = "inherit";
    }
    if (!this._theme.components!.menu.default.borderColor) {
      this._theme.components!.menu.default.borderColor = "transparent";
    }
    if (!this._theme.components!.menu.default.borderRadius) {
      this._theme.components!.menu.default.borderRadius =
        this._theme.borderRadius;
    }
    if (!this._theme.components!.menu.default.padding) {
      this._theme.components!.menu.default.padding = "0.25rem 0";
    }
    if (!this._theme.components!.menu.default.outline) {
      this._theme.components!.menu.default.outline = "none";
    }
    if (!this._theme.components!.menu.default.boxShadow) {
      this._theme.components!.menu.default.boxShadow = this._theme.boxShadow;
    }
    if (!this._theme.components!.menu.default.fontWeight) {
      this._theme.components!.menu.default.fontWeight = "normal";
    }
    if (!this._theme.components!.menu.default.fontSize) {
      this._theme.components!.menu.default.fontSize =
        this._theme.font?.code?.size.small;
    }

    return this;
  }

  /** Set default input component */
  private static _input() {
    if (!this._theme.components!.input) {
      this._theme.components!.input = {};
    }

    if (!this._theme.components!.input.bg) {
      this._theme.components!.input.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.components!.input.color) {
      this._theme.components!.input.color =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.components!.input.borderColor) {
      this._theme.components!.input.borderColor =
        this._theme.colors.default.borderColor;
    }
    if (!this._theme.components!.input.borderRadius) {
      this._theme.components!.input.borderRadius = this._theme.borderRadius;
    }
    if (!this._theme.components!.input.padding) {
      this._theme.components!.input.padding = "0.25rem 0.5rem";
    }
    if (!this._theme.components!.input.focus) {
      this._theme.components!.input.focus = {};
    }
    if (!this._theme.components!.input.focus.outline) {
      this._theme.components!.input.focus.outline = `1px solid ${
        this._theme.colors.default.primary + this._theme.transparency!.medium
      }`;
    }
    if (!this._theme.components!.input.boxShadow) {
      this._theme.components!.input.boxShadow = "none";
    }
    if (!this._theme.components!.input.fontWeight) {
      this._theme.components!.input.fontWeight = "normal";
    }
    if (!this._theme.components!.input.fontSize) {
      this._theme.components!.input.fontSize =
        this._theme.font?.code?.size.medium;
    }

    return this;
  }

  /** Set default select component */
  private static _select() {
    if (!this._theme.components!.select) {
      this._theme.components!.select = {};
    }

    // Control
    if (!this._theme.components!.select.control) {
      this._theme.components!.select.control = {};
    }
    if (!this._theme.components!.select.control.bg) {
      this._theme.components!.select.control.bg =
        this._theme.components!.input!.bg;
    }
    if (!this._theme.components!.select.control.borderColor) {
      this._theme.components!.select.control.borderColor =
        this._theme.colors.default.borderColor;
    }
    if (!this._theme.components!.select.control.borderRadius) {
      this._theme.components!.select.control.borderRadius =
        this._theme.borderRadius;
    }
    if (!this._theme.components!.select.control.hover) {
      this._theme.components!.select.control.hover = {};
    }
    if (!this._theme.components!.select.control.hover.borderColor) {
      this._theme.components!.select.control.hover.borderColor =
        this._theme.colors.state.hover.color;
    }
    if (!this._theme.components!.select.control.focusWithin) {
      this._theme.components!.select.control.focusWithin = {};
    }
    if (!this._theme.components!.select.control.focusWithin.boxShadow) {
      this._theme.components!.select.control.focusWithin.boxShadow = `0 0 0 1px ${
        this._theme.colors.default.primary + this._theme.transparency!.high
      }`;
    }

    // Menu
    if (!this._theme.components!.select.menu) {
      this._theme.components!.select.menu = {};
    }
    if (!this._theme.components!.select.menu.bg) {
      this._theme.components!.select.menu.bg =
        this._theme.components!.input!.bg;
    }
    if (!this._theme.components!.select.menu.color) {
      this._theme.components!.select.menu.color =
        this._theme.components!.input!.color;
    }
    if (!this._theme.components!.select.menu.borderRadius) {
      this._theme.components!.select.menu.borderRadius =
        this._theme.components!.input!.borderRadius;
    }

    // Option
    if (!this._theme.components!.select.option) {
      this._theme.components!.select.option = {};
    }
    if (!this._theme.components!.select.option.bg) {
      this._theme.components!.select.option.bg =
        this._theme.components!.input!.bg;
    }
    if (!this._theme.components!.select.option.color) {
      this._theme.components!.select.option.color =
        this._theme.colors.default.textSecondary;
    }
    if (!this._theme.components!.select.option.cursor) {
      this._theme.components!.select.option.cursor = "pointer";
    }
    // Option::before
    if (!this._theme.components!.select.option.before) {
      this._theme.components!.select.option.before = {};
    }
    if (!this._theme.components!.select.option.before.color) {
      this._theme.components!.select.option.before.color =
        this._theme.colors.default.primary;
    }
    // Option:focus
    if (!this._theme.components!.select.option.focus) {
      this._theme.components!.select.option.focus = {};
    }
    if (!this._theme.components!.select.option.focus.bg) {
      this._theme.components!.select.option.focus.bg =
        this._theme.colors.state.hover.bg;
    }
    if (!this._theme.components!.select.option.focus.color) {
      this._theme.components!.select.option.focus.color =
        this._theme.colors.default.primary;
    }
    // Option:active
    if (!this._theme.components!.select.option.active) {
      this._theme.components!.select.option.active = {};
    }
    if (!this._theme.components!.select.option.active.bg) {
      this._theme.components!.select.option.active.bg =
        this._theme.colors.state.hover.bg;
    }

    // Single Value
    if (!this._theme.components!.select.singleValue) {
      this._theme.components!.select.singleValue = {};
    }
    if (!this._theme.components!.select.singleValue.bg) {
      this._theme.components!.select.singleValue.bg =
        this._theme.components?.input?.bg;
    }
    if (!this._theme.components!.select.singleValue.color) {
      this._theme.components!.select.singleValue.color =
        this._theme.components?.input?.color;
    }

    // Input
    if (!this._theme.components!.select.input) {
      this._theme.components!.select.input = {};
    }
    if (!this._theme.components!.select.input.color) {
      this._theme.components!.select.input.color =
        this._theme.components?.input?.color;
    }

    // Group Heading
    if (!this._theme.components!.select.groupHeading) {
      this._theme.components!.select.groupHeading = {};
    }
    if (!this._theme.components!.select.groupHeading.color) {
      this._theme.components!.select.groupHeading.color =
        this._theme.colors.default.textSecondary;
    }

    // Dropdown Indicator
    if (!this._theme.components!.select.dropdownIndicator) {
      this._theme.components!.select.dropdownIndicator = {};
    }
    if (!this._theme.components!.select.dropdownIndicator.padding) {
      this._theme.components!.select.dropdownIndicator.padding = "0.25rem";
    }

    // Indicator Separator
    if (!this._theme.components!.select.indicatorSeparator) {
      this._theme.components!.select.indicatorSeparator = {};
    }
    if (!this._theme.components!.select.indicatorSeparator.bg) {
      this._theme.components!.select.indicatorSeparator.bg =
        this._theme.colors.default.textSecondary;
    }

    return this;
  }

  /** Set default markdown component */
  private static _markdown() {
    if (!this._theme.colors.markdown) {
      this._theme.colors.markdown = {};
    }
    if (!this._theme.colors.markdown.bg) {
      this._theme.colors.markdown.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.markdown.color) {
      this._theme.colors.markdown.color =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.markdown.code) {
      this._theme.colors.markdown.code = {};
    }
    if (!this._theme.colors.markdown.code.bg) {
      this._theme.colors.markdown.code.bg =
        this._theme.colors.default.bgSecondary;
    }
    if (!this._theme.colors.markdown.code.color) {
      this._theme.colors.markdown.code.color =
        this._theme.colors.default.textPrimary;
    }

    return this;
  }

  /** Set default skeleton component */
  private static _skeleton() {
    if (!this._theme.skeleton) {
      this._theme.skeleton = DEFAULT_SKELETON;
    }
    return this;
  }

  /** Set default tooltip component */
  private static _tooltip() {
    if (!this._theme.colors.tooltip) {
      this._theme.colors.tooltip = {};
    }
    if (!this._theme.colors.tooltip.bg) {
      this._theme.colors.tooltip.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.tooltip.color) {
      this._theme.colors.tooltip.color = this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.tooltip.bgSecondary) {
      this._theme.colors.tooltip.bgSecondary =
        this._theme.colors.default.bgSecondary;
    }

    return this;
  }

  /** Set default sidebar right */
  private static _sidebarRight() {
    if (!this._theme.colors.right) {
      this._theme.colors.right = {};
    }
    if (!this._theme.colors.right.bg) {
      this._theme.colors.right.bg = this._theme.colors.default.bgSecondary;
    }

    if (!this._theme.colors.right.otherBg) {
      this._theme.colors.right.otherBg = this._theme.colors.default.bgPrimary;
    }

    return this;
  }

  /** Set default editor */
  private static _editor() {
    if (!this._theme.colors.editor) {
      this._theme.colors.editor = {};
    }
    if (!this._theme.colors.editor.bg) {
      this._theme.colors.editor.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.editor.color) {
      this._theme.colors.editor.color = this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.editor.cursorColor) {
      this._theme.colors.editor.cursorColor =
        this._theme.colors.default.textSecondary;
    }

    // Editor active line
    if (!this._theme.colors.editor.activeLine) {
      this._theme.colors.editor.activeLine = {};
    }
    if (!this._theme.colors.editor.activeLine.bg) {
      this._theme.colors.editor.activeLine.bg = "inherit";
    }
    if (!this._theme.colors.editor.activeLine.borderColor) {
      this._theme.colors.editor.activeLine.borderColor =
        this._theme.colors.default.borderColor;
    }

    // Editor selection
    if (!this._theme.colors.editor?.selection) {
      this._theme.colors.editor.selection = {};
    }

    if (!this._theme.colors.editor.selection.bg) {
      this._theme.colors.editor.selection.bg =
        this._theme.colors.default.primary + this._theme.transparency!.medium;
    }

    if (!this._theme.colors.editor.selection.color) {
      this._theme.colors.editor.selection.color = "inherit";
    }

    // Editor search match
    if (!this._theme.colors.editor?.searchMatch) {
      this._theme.colors.editor.searchMatch = {};
    }
    if (!this._theme.colors.editor.searchMatch.bg) {
      this._theme.colors.editor.searchMatch.bg =
        this._theme.colors.default.textSecondary +
        this._theme.transparency!.medium;
    }
    if (!this._theme.colors.editor.searchMatch.color) {
      this._theme.colors.editor.searchMatch.color = "inherit";
    }
    if (!this._theme.colors.editor.searchMatch.selectedBg) {
      this._theme.colors.editor.searchMatch.selectedBg = "inherit";
    }
    if (!this._theme.colors.editor.searchMatch.selectedColor) {
      this._theme.colors.editor.searchMatch.selectedColor = "inherit";
    }

    // Editor gutter
    if (!this._theme.colors.editor?.gutter) {
      this._theme.colors.editor.gutter = {};
    }
    if (!this._theme.colors.editor.gutter.bg) {
      this._theme.colors.editor.gutter.bg = this._theme.colors.editor.bg;
    }
    if (!this._theme.colors.editor.gutter.color) {
      this._theme.colors.editor.gutter.color =
        this._theme.colors.default.textSecondary;
    }

    // Editor tooltip/dropdown
    if (!this._theme.colors.editor?.tooltip) {
      this._theme.colors.editor.tooltip = {};
    }
    if (!this._theme.colors.editor.tooltip.bg) {
      this._theme.colors.editor.tooltip.bg =
        this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.editor.tooltip.color) {
      this._theme.colors.editor.tooltip.color =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.editor.tooltip.selectedBg) {
      this._theme.colors.editor.tooltip.selectedBg =
        this._theme.colors.default.primary + this._theme.transparency?.medium;
    }
    if (!this._theme.colors.editor.tooltip.selectedColor) {
      this._theme.colors.editor.tooltip.selectedColor =
        this._theme.colors.default.textPrimary;
    }

    return this;
  }

  /** Set default home */
  private static _home() {
    if (!this._theme.colors.home) {
      this._theme.colors.home = {};
    }
    if (!this._theme.colors.home.bg) {
      this._theme.colors.home.bg = this._theme.colors.default.bgSecondary;
    }
    if (!this._theme.colors.home.color) {
      this._theme.colors.home.color = this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.home.card) {
      this._theme.colors.home.card = {};
    }
    if (!this._theme.colors.home.card.bg) {
      this._theme.colors.home.card.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.home.card.color) {
      this._theme.colors.home.card.color =
        this._theme.colors.default.textPrimary;
    }

    return this;
  }

  /** Set default terminal */
  private static _terminal() {
    if (!this._theme.colors.terminal) {
      this._theme.colors.terminal = {};
    }
    if (!this._theme.colors.terminal.bg) {
      this._theme.colors.terminal.bg = this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.terminal.color) {
      this._theme.colors.terminal.color =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.terminal.cursorColor) {
      this._theme.colors.terminal.cursorColor =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.terminal.selectionBg) {
      this._theme.colors.terminal.selectionBg =
        this._theme.colors.default.textSecondary;
    }

    return this;
  }

  /** Set default tutorial */
  private static _tutorial() {
    if (!this._theme.colors.tutorial) {
      this._theme.colors.tutorial = {};
    }
    if (!this._theme.colors.tutorial.bg) {
      this._theme.colors.tutorial.bg = this._theme.colors.default.bgSecondary;
    }
    if (!this._theme.colors.tutorial.color) {
      this._theme.colors.tutorial.color =
        this._theme.colors.default.textPrimary;
    }

    return this;
  }

  /** Set default tutorials */
  private static _tutorials() {
    if (!this._theme.colors.tutorials) {
      this._theme.colors.tutorials = {};
    }
    if (!this._theme.colors.tutorials.bg) {
      this._theme.colors.tutorials.bg = this._theme.colors.default.bgSecondary;
    }
    if (!this._theme.colors.tutorials.color) {
      this._theme.colors.tutorials.color =
        this._theme.colors.default.textPrimary;
    }
    if (!this._theme.colors.tutorials.card) {
      this._theme.colors.tutorials.card = {};
    }
    if (!this._theme.colors.tutorials.card.bg) {
      this._theme.colors.tutorials.card.bg =
        this._theme.colors.default.bgPrimary;
    }
    if (!this._theme.colors.tutorials.card.color) {
      this._theme.colors.tutorials.card.color =
        this._theme.colors.default.textPrimary;
    }

    return this;
  }

  /** Set default fonts */
  private static _fonts() {
    if (!this._theme.font) {
      this._theme.font = {};
    }
    if (!this._theme.font.code) {
      this._theme.font.code = this._font;
    }
    if (!this._theme.font.other) {
      this._theme.font.other = DEFAULT_FONT_OTHER;
    }

    return this;
  }

  /** Theme key in localStorage */
  private static readonly _THEME_KEY = "theme";

  /** Font key in localStorage */
  private static readonly _FONT_KEY = "font";
}
