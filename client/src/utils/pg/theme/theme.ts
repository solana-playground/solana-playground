import { CSSProperties } from "react";

import { EventName } from "../../../constants";
import { PgCommon } from "../common";
import {
  DefaultComponent,
  ImportableTheme,
  PgFont,
  PgThemeInternal,
} from "./interface";

export class PgThemeManager {
  /** Current theme */
  private static _theme: PgThemeInternal;

  /** Current font */
  private static _font: PgFont;

  /** All themes */
  private static _themes: ImportableTheme[];

  /** All fonts */
  private static _fonts: PgFont[];

  /** Theme key in localStorage */
  private static readonly _THEME_KEY = "theme";

  /** Font key in localStorage */
  private static readonly _FONT_KEY = "font";

  /**
   * Create the initial theme and font from `localStorage`.
   *
   * @param themes all importable themes
   * @param fonts all fonts
   */
  static async create(themes: ImportableTheme[], fonts: PgFont[]) {
    this._themes = themes;
    this._fonts = fonts;
    await this.set();
  }

  /**
   * Set theme and font.
   *
   * The theme will be imported asynchronously based on the given theme name or
   * the name in `localStorage`.
   *
   * This function is also responsible for setting sensible defaults.
   *
   * @param params theme name and font family
   */
  static async set(
    params: Partial<{
      themeName: PgThemeInternal["name"];
      fontFamily: PgFont["family"];
    }> = {}
  ) {
    params.themeName ??=
      localStorage.getItem(this._THEME_KEY) ?? this._themes[0].name;
    params.fontFamily ??=
      localStorage.getItem(this._FONT_KEY) ?? this._fonts[0].family;

    let importableTheme = this._themes.find((t) => t.name === params.themeName);

    // This could happen when:
    // 1. The theme name was updated/deleted
    // 2. The theme key was overridden by another app when running locally
    // 3. The user manually edited `localStorage` theme value
    if (!importableTheme) {
      importableTheme = this._themes[0];
      params.themeName = importableTheme.name;
      params.fontFamily = this._fonts[0].family;
    }

    const font = this._fonts.find((f) => f.family === params.fontFamily)!;

    // Cloning the object because override functions expect the theme to be
    // uninitialized. Keeping a reference to an old theme may cause unwanted
    // side effects.
    this._theme = structuredClone(
      (await importableTheme.importTheme()).default
    );
    this._theme.name = importableTheme.name;
    this._font = font;

    // Set defaults(order matters)
    this._theme_fonts()
      ._default()
      ._stateColors()
      ._components()
      ._skeleton()
      ._button()
      ._menu()
      ._input()
      ._select()
      ._toast()
      ._tooltip()
      ._markdown()
      ._sidebar()
      ._editor()
      ._home()
      ._terminal()
      ._bottom()
      ._tutorial()
      ._tutorials();

    // Set theme
    localStorage.setItem(this._THEME_KEY, params.themeName);
    PgCommon.createAndDispatchCustomEvent(EventName.THEME_SET, this._theme);

    // Set font
    localStorage.setItem(this._FONT_KEY, params.fontFamily);
    PgCommon.createAndDispatchCustomEvent(EventName.THEME_FONT_SET, this._font);
  }

  /**
   * Convert the component object styles into CSS styles.
   *
   * @param component Component to convert to CSS
   * @returns the converted CSS
   */
  static convertToCSS(component: DefaultComponent): string {
    return Object.keys(component).reduce((acc, cur) => {
      const key = cur as keyof DefaultComponent;
      const value = component[key];

      let prop = PgCommon.toKebabFromCamel(key) as keyof CSSProperties;
      switch (key) {
        case "bg":
          prop = "background";
          break;

        case "hover":
        case "active":
        case "focus":
        case "focusWithin":
          return `${acc}&:${prop}{${this.convertToCSS(
            value as DefaultComponent
          )}}`;

        case "before":
        case "after":
          return `${acc}&::${prop}{${this.convertToCSS(
            value as DefaultComponent
          )}}`;
      }

      // Only allow string and number values
      if (typeof value === "string" || typeof value === "number") {
        return `${acc}${prop}:${value};`;
      }

      return acc;
    }, "");
  }

  /**
   * Override default component styles with the given overrides
   *
   * @param component default component to override
   * @param overrides override properties
   * @returns the overridden component
   */
  static overrideDefaults<T extends DefaultComponent>(
    component: T,
    overrides?: T
  ) {
    if (!overrides) {
      return component;
    }

    for (const key in overrides) {
      const value = overrides[key];

      if (typeof value === "object") {
        component[key] = { ...component[key], ...value };
      } else {
        component[key] = value;
      }
    }

    return component;
  }

  /** Set default fonts */
  private static _theme_fonts() {
    this._theme.font ??= {};
    this._theme.font.code ??= this._font;
    this._theme.font.other ??= {
      family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
        sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`,
      size: {
        xsmall: "0.8125rem",
        small: "0.875rem",
        medium: "1rem",
        large: "1.25rem",
        xlarge: "1.5rem",
      },
    };

    return this;
  }

  /** Set defaults */
  private static _default() {
    this._theme.default ??= {};

    // Border radius
    this._theme.default!.borderRadius ??= "4px";

    // Box shadow
    this._theme.default!.boxShadow ??= "rgb(0 0 0 / 25%) -1px 3px 4px";

    // Scrollbar
    if (!this._theme.default.scrollbar) {
      if (this._theme.isDark) {
        this._theme.default.scrollbar = {
          thumb: {
            color: "#ffffff64",
            hoverColor: "#ffffff32",
          },
        };
      } else {
        this._theme.default.scrollbar = {
          thumb: {
            color: "#00000032",
            hoverColor: "#00000064",
          },
        };
      }
    }

    // Transition
    this._theme.default.transition ??= {
      type: "linear",
      duration: {
        short: "50ms",
        medium: "150ms",
        long: "250ms",
      },
    };

    // Transparency
    this._theme.default.transparency ??= {
      low: "16",
      medium: "64",
      high: "bb",
    };

    return this;
  }

  /** Set default state colors */
  private static _stateColors() {
    this._theme.colors.state.disabled.bg ??=
      this._theme.colors.state.disabled.color +
      this._theme.default!.transparency!.low;
    this._theme.colors.state.error.bg ??=
      this._theme.colors.state.error.color +
      this._theme.default!.transparency!.low;
    this._theme.colors.state.hover.bg ??=
      this._theme.colors.state.hover.color +
      this._theme.default!.transparency!.low;
    this._theme.colors.state.info.bg ??=
      this._theme.colors.state.info.color +
      this._theme.default!.transparency!.low;
    this._theme.colors.state.success.bg ??=
      this._theme.colors.state.success.color +
      this._theme.default!.transparency!.low;
    this._theme.colors.state.warning.bg ??=
      this._theme.colors.state.warning.color +
      this._theme.default!.transparency!.low;

    return this;
  }

  /** Set default components */
  private static _components() {
    this._theme.components ??= {};

    return this;
  }

  /** Set default skeleton component */
  private static _skeleton() {
    this._theme.components!.skeleton ??= {};
    this._theme.components!.skeleton.bg ??= "#44475A";
    this._theme.components!.skeleton.highlightColor ??= "#343746";
    this._theme.components!.skeleton.borderRadius ??=
      this._theme.default!.borderRadius;

    return this;
  }

  /** Set default button component */
  private static _button() {
    this._theme.components!.button ??= {};

    // Default
    this._theme.components!.button.default ??= {};
    this._theme.components!.button.default.bg ??= "transparent";
    this._theme.components!.button.default.color ??= "inherit";
    this._theme.components!.button.default.borderColor ??= "transparent";
    this._theme.components!.button.default.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.button.default.fontSize ??=
      this._theme.font!.code!.size.medium;
    this._theme.components!.button.default.fontWeight ??= "normal";
    this._theme.components!.button.default.hover ??= {};

    return this;
  }

  /** Set default menu component */
  private static _menu() {
    this._theme.components!.menu ??= {};

    // Default
    this._theme.components!.menu.default ??= {};
    this._theme.components!.menu.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.menu.default.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.menu.default.padding ??= "0.25rem 0";
    this._theme.components!.menu.default.boxShadow ??=
      this._theme.default!.boxShadow;

    return this;
  }

  /** Set default input component */
  private static _input() {
    this._theme.components!.input ??= {};

    this._theme.components!.input.bg ??= this._theme.colors.default.bgPrimary;
    this._theme.components!.input.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.input.borderColor ??=
      this._theme.colors.default.border;
    this._theme.components!.input.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.input.padding ??= "0.25rem 0.5rem";
    this._theme.components!.input.boxShadow ??= "none";
    this._theme.components!.input.fontWeight ??= "normal";
    this._theme.components!.input.fontSize ??=
      this._theme.font!.code!.size.medium;

    this._theme.components!.input.focus ??= {};
    this._theme.components!.input.focus.outline ??= `1px solid ${
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.medium
    }`;

    this._theme.components!.input.focusWithin ??= {};
    this._theme.components!.input.focusWithin.outline ??= `1px solid ${
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.medium
    }`;

    return this;
  }

  /** Set default select component */
  private static _select() {
    this._theme.components!.select ??= {};

    // Default
    this._theme.components!.select.default ??= {};
    this._theme.components!.select.default.fontSize ??=
      this._theme.font!.code!.size.small;

    // Control
    this._theme.components!.select.control ??= {};
    this._theme.components!.select.control.bg ??=
      this._theme.components!.input!.bg;
    this._theme.components!.select.control.borderColor ??=
      this._theme.colors.default.border;
    this._theme.components!.select.control.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.select.control.minHeight ??= "fit-content";
    this._theme.components!.select.control.hover ??= {};
    this._theme.components!.select.control.hover.borderColor ??=
      this._theme.colors.state.hover.color;
    this._theme.components!.select.control.hover.cursor ??= "pointer";
    this._theme.components!.select.control.focusWithin ??= {};
    this._theme.components!.select.control.focusWithin.boxShadow ??= `0 0 0 1px ${
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.high
    }`;

    // Menu
    this._theme.components!.select.menu ??= {};
    this._theme.components!.select.menu.bg ??=
      this._theme.components!.input!.bg;
    this._theme.components!.select.menu.color ??=
      this._theme.components!.input!.color;
    this._theme.components!.select.menu.borderRadius ??=
      this._theme.components!.input!.borderRadius;

    // Option
    this._theme.components!.select.option ??= {};
    this._theme.components!.select.option.bg ??=
      this._theme.components!.input!.bg;
    this._theme.components!.select.option.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.select.option.cursor ??= "pointer";
    // Option::before
    this._theme.components!.select.option.before ??= {};
    this._theme.components!.select.option.before.color ??=
      this._theme.colors.default.primary;
    // Option:focus
    this._theme.components!.select.option.focus ??= {};
    this._theme.components!.select.option.focus.bg ??=
      this._theme.colors.state.hover.bg;
    this._theme.components!.select.option.focus.color ??=
      this._theme.colors.default.primary;
    // Option:active
    this._theme.components!.select.option.active ??= {};
    this._theme.components!.select.option.active.bg ??=
      this._theme.colors.state.hover.bg;

    // Single Value
    this._theme.components!.select.singleValue ??= {};
    this._theme.components!.select.singleValue.bg ??=
      this._theme.components?.input?.bg;
    this._theme.components!.select.singleValue.color ??=
      this._theme.components?.input?.color;

    // Input
    this._theme.components!.select.input ??= {};
    this._theme.components!.select.input.color ??=
      this._theme.components?.input?.color;

    // Group Heading
    this._theme.components!.select.groupHeading ??= {};
    this._theme.components!.select.groupHeading.color ??=
      this._theme.colors.default.textSecondary;

    // Dropdown Indicator
    this._theme.components!.select.dropdownIndicator ??= {};
    this._theme.components!.select.dropdownIndicator.padding ??= "0.25rem";

    // Indicator Separator
    this._theme.components!.select.indicatorSeparator ??= {};
    this._theme.components!.select.indicatorSeparator.bg ??=
      this._theme.colors.default.textSecondary;

    return this;
  }

  /** Set default skeleton component */
  private static _toast() {
    this._theme.components!.toast ??= {};

    // Default
    this._theme.components!.toast.default ??= {};
    this._theme.components!.toast.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.toast.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.toast.default.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.toast.default.fontFamily ??=
      this._theme.font!.code!.family;
    this._theme.components!.toast.default.fontSize ??=
      this._theme.font!.code!.size.medium;
    this._theme.components!.toast.default.cursor ??= "default";

    // Progress bar
    this._theme.components!.toast.progress ??= {};
    this._theme.components!.toast.progress.bg ??=
      this._theme.colors.default.primary;

    // Close button
    this._theme.components!.toast.closeButton ??= {};
    this._theme.components!.toast.closeButton.color ??=
      this._theme.colors.default.textSecondary;

    return this;
  }

  /** Set default tooltip component */
  private static _tooltip() {
    this._theme.components!.tooltip ??= {};
    this._theme.components!.tooltip.bg ??= this._theme.colors.default.bgPrimary;
    this._theme.components!.tooltip.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.tooltip.bgSecondary ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.tooltip.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.tooltip.boxShadow ??=
      this._theme.default!.boxShadow;
    this._theme.components!.tooltip.fontSize ??=
      this._theme.font!.code!.size.small;

    return this;
  }

  /** Set default markdown component */
  private static _markdown() {
    this._theme.components!.markdown ??= {};

    // Default
    this._theme.components!.markdown.default ??= {};
    this._theme.components!.markdown.default.bg ??= "inherit";
    this._theme.components!.markdown.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.markdown.default.fontFamily ??=
      this._theme.font!.other!.family;
    this._theme.components!.markdown.default.fontSize ??=
      this._theme.font!.other!.size.medium;

    // Code block
    this._theme.components!.markdown.code ??= {};
    this._theme.components!.markdown.code.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.markdown.code.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.markdown.code.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.markdown.code.fontFamily ??=
      this._theme.font!.code!.family;
    this._theme.components!.markdown.code.fontSize ??=
      this._theme.font!.code!.size.medium;

    return this;
  }

  /** Set default sidebar component */
  private static _sidebar() {
    this._theme.components!.sidebar ??= {};

    // Default
    this._theme.components!.sidebar.default ??= {};

    // Left
    this._theme.components!.sidebar.left ??= {};
    // Left default
    this._theme.components!.sidebar.left.default ??= {};
    this._theme.components!.sidebar.left.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.sidebar.left.default.borderRight ??= `1px solid ${this._theme.colors.default.border}`;

    // Left icon button
    this._theme.components!.sidebar.left.iconButton ??= {};
    // Left icon button default
    this._theme.components!.sidebar.left.iconButton.default ??= {};
    // Left icon button selected
    this._theme.components!.sidebar.left.iconButton.selected ??= {};
    this._theme.components!.sidebar.left.iconButton.selected.bg ??=
      this._theme.colors.state.hover.bg;
    this._theme.components!.sidebar.left.iconButton.selected.borderLeft ??= `2px solid ${this._theme.colors.default.secondary}`;
    this._theme.components!.sidebar.left.iconButton.selected.borderRight ??=
      "2px solid transparent";

    // Right
    this._theme.components!.sidebar.right ??= {};
    // Right default
    this._theme.components!.sidebar.right.default ??= {};
    this._theme.components!.sidebar.right.default.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.sidebar.right.default.otherBg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.sidebar.right.default.borderRight ??= `1px solid ${this._theme.colors.default.border}`;
    // Right title
    this._theme.components!.sidebar.right.title ??= {};
    this._theme.components!.sidebar.right.title.borderBottom ??= `1px solid ${this._theme.colors.default.border};`;
    this._theme.components!.sidebar.right.title.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.sidebar.right.title.fontSize ??=
      this._theme.font!.code!.size.large;

    return this;
  }

  /** Set default editor */
  private static _editor() {
    this._theme.components!.editor ??= {};

    this._theme.components!.editor.default ??= {};
    this._theme.components!.editor.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.editor.default.color ??=
      this._theme.colors.default.textPrimary;

    // Editor cursor color
    this._theme.components!.editor.default.cursorColor ??=
      this._theme.colors.default.textSecondary;

    // Editor active line
    this._theme.components!.editor.default.activeLine ??= {};
    this._theme.components!.editor.default.activeLine.bg ??= "inherit";
    this._theme.components!.editor.default.activeLine.borderColor ??=
      this._theme.colors.default.border;

    // Editor selection
    this._theme.components!.editor.default.selection ??= {};
    this._theme.components!.editor.default.selection.bg ??=
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.medium;
    this._theme.components!.editor.default.selection.color ??= "inherit";

    // Editor search match
    this._theme.components!.editor.default.searchMatch ??= {};
    this._theme.components!.editor.default.searchMatch.bg ??=
      this._theme.colors.default.textSecondary +
      this._theme.default!.transparency!.medium;
    this._theme.components!.editor.default.searchMatch.color ??= "inherit";
    this._theme.components!.editor.default.searchMatch.selectedBg ??= "inherit";
    this._theme.components!.editor.default.searchMatch.selectedColor ??=
      "inherit";

    // Editor gutter
    this._theme.components!.editor.gutter ??= {};
    this._theme.components!.editor.gutter.bg ??=
      this._theme.components!.editor.default.bg;
    this._theme.components!.editor.gutter.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.editor.gutter.activeBg ??= "inherit";
    this._theme.components!.editor.gutter.activeColor ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.editor.gutter.borderRight ??= "none";

    // Editor minimap
    this._theme.components!.editor.minimap ??= {};
    this._theme.components!.editor.minimap.bg ??=
      this._theme.components!.editor.default.bg;
    this._theme.components!.editor.minimap.selectionHighlight ??=
      this._theme.colors.default.secondary;

    // Editor peek view
    this._theme.components!.editor.peekView ??= {};
    this._theme.components!.editor.peekView.borderColor ??=
      this._theme.colors.default.primary;
    // Editor peek view title
    this._theme.components!.editor.peekView.title ??= {};
    this._theme.components!.editor.peekView.title.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.editor.peekView.title.labelColor ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.editor.peekView.title.descriptionColor ??=
      this._theme.colors.default.textSecondary;
    // Editor peek view editor
    this._theme.components!.editor.peekView.editor ??= {};
    this._theme.components!.editor.peekView.editor.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.editor.peekView.editor.matchHighlightBg ??=
      this._theme.colors.state.warning.color +
      this._theme.default!.transparency!.medium;
    this._theme.components!.editor.peekView.editor.gutterBg ??=
      this._theme.components!.editor.peekView.editor.bg;
    // Editor peek view result
    this._theme.components!.editor.peekView.result ??= {};
    this._theme.components!.editor.peekView.result.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.editor.peekView.result.lineColor ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.editor.peekView.result.fileColor ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.editor.peekView.result.selectionBg ??=
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.low;
    this._theme.components!.editor.peekView.result.selectionColor ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.editor.peekView.result.matchHighlightBg ??=
      this._theme.colors.state.warning.color +
      this._theme.default!.transparency!.medium;

    // Editor tooltip/widget
    this._theme.components!.editor.tooltip ??= {};
    this._theme.components!.editor.tooltip.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.editor.tooltip.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.editor.tooltip.selectedBg ??=
      this._theme.colors.default.primary +
      this._theme.default!.transparency!.medium;
    this._theme.components!.editor.tooltip.selectedColor ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.editor.tooltip.borderColor ??=
      this._theme.colors.default.border;

    return this;
  }

  /** Set default home */
  private static _home() {
    this._theme.components!.home ??= {};

    // Default
    this._theme.components!.home.default ??= {};
    this._theme.components!.home.default.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.home.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.home.default.height ??= "100%";
    this._theme.components!.home.default.padding ??= "0 8%";

    // Title
    this._theme.components!.home.title ??= {};
    this._theme.components!.home.title.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.home.title.padding ??= "2rem";
    this._theme.components!.home.title.fontWeight ??= "bold";
    this._theme.components!.home.title.fontSize ??= "2rem";
    this._theme.components!.home.title.textAlign ??= "center";

    // Resources
    this._theme.components!.home.resources ??= {};
    // Resources default
    this._theme.components!.home.resources.default ??= {};
    this._theme.components!.home.resources.default.maxWidth ??= "53rem";
    // Resources title
    this._theme.components!.home.resources.title ??= {};
    this._theme.components!.home.resources.title.marginBottom ??= "1rem";
    this._theme.components!.home.resources.title.fontWeight ??= "bold";
    this._theme.components!.home.resources.title.fontSize ??= "1.25rem";
    // Resources card
    this._theme.components!.home.resources.card ??= {};
    // Resources card default
    this._theme.components!.home.resources.card.default ??= {};
    this._theme.components!.home.resources.card.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.home.resources.card.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.home.resources.card.default.border ??= `1px solid ${
      this._theme.colors.default.border +
      this._theme.default!.transparency!.medium
    }`;
    this._theme.components!.home.resources.card.default.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.home.resources.card.default.width ??= "15rem";
    this._theme.components!.home.resources.card.default.height ??= "15rem";
    this._theme.components!.home.resources.card.default.padding ??=
      "1rem 1.5rem 1.5rem 1.5rem";
    this._theme.components!.home.resources.card.default.marginRight ??= "2rem";
    this._theme.components!.home.resources.card.default.marginBottom ??= "2rem";
    // Resources card image
    this._theme.components!.home.resources.card.image ??= {};
    this._theme.components!.home.resources.card.image.width ??= "1.25rem";
    this._theme.components!.home.resources.card.image.height ??= "1.25rem";
    this._theme.components!.home.resources.card.image.marginRight ??= "0.5rem";
    // Resources card title
    this._theme.components!.home.resources.card.title ??= {};
    this._theme.components!.home.resources.card.title.display ??= "flex";
    this._theme.components!.home.resources.card.title.alignItems ??= "center";
    this._theme.components!.home.resources.card.title.height ??= "20%";
    this._theme.components!.home.resources.card.title.fontWeight ??= "bold";
    this._theme.components!.home.resources.card.title.fontSize ??=
      this._theme.font!.code!.size.xlarge;
    // Resources card description
    this._theme.components!.home.resources.card.description ??= {};
    this._theme.components!.home.resources.card.description.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.home.resources.card.description.height ??= "60%";
    // Resources card button
    this._theme.components!.home.resources.card.button ??= {};
    this._theme.components!.home.resources.card.button.width ??= "100%";

    // Tutorials
    this._theme.components!.home.tutorials ??= {};
    // Tutorials default
    this._theme.components!.home.tutorials.default ??= {};
    this._theme.components!.home.tutorials.default.minWidth ??= "16rem";
    this._theme.components!.home.tutorials.default.maxWidth ??= "27rem";
    // Tutorials title
    this._theme.components!.home.tutorials.title ??= {};
    this._theme.components!.home.tutorials.title.marginBottom ??= "1rem";
    this._theme.components!.home.tutorials.title.fontWeight ??= "bold";
    this._theme.components!.home.tutorials.title.fontSize ??= "1.25rem";
    // Tutorials card
    this._theme.components!.home.tutorials.card ??= {};
    this._theme.components!.home.tutorials.card.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.home.tutorials.card.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.home.tutorials.card.border ??= `1px solid
      ${
        this._theme.colors.default.border +
        this._theme.default!.transparency!.medium
      }`;
    this._theme.components!.home.tutorials.card.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.home.tutorials.card.padding ??= "1rem";
    this._theme.components!.home.tutorials.card.marginBottom ??= "1rem";
    this._theme.components!.home.tutorials.card.transition ??= `all ${
      this._theme.default!.transition!.duration.medium
    } ${this._theme.default!.transition!.type}`;
    this._theme.components!.home.tutorials.card.display ??= "flex";
    this._theme.components!.home.tutorials.card.alignItems ??= "center";
    this._theme.components!.home.tutorials.card.hover ??= {};
    this._theme.components!.home.tutorials.card.hover.bg ??=
      this._theme.colors.state.hover.bg;

    return this;
  }

  /** Set default terminal component */
  private static _terminal() {
    this._theme.components!.terminal ??= {};

    // Default
    this._theme.components!.terminal.default ??= {};
    this._theme.components!.terminal.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.terminal.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.terminal.default.borderTop ??= `1px solid ${this._theme.colors.default.primary};`;

    // Xterm
    this._theme.components!.terminal.xterm ??= {};
    this._theme.components!.terminal.xterm.textPrimary ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.terminal.xterm.textSecondary ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.terminal.xterm.primary ??=
      this._theme.colors.default.primary;
    this._theme.components!.terminal.xterm.secondary ??=
      this._theme.colors.default.secondary;
    this._theme.components!.terminal.xterm.success ??=
      this._theme.colors.state.success.color;
    this._theme.components!.terminal.xterm.error ??=
      this._theme.colors.state.error.color;
    this._theme.components!.terminal.xterm.warning ??=
      this._theme.colors.state.warning.color;
    this._theme.components!.terminal.xterm.info ??=
      this._theme.colors.state.info.color;
    this._theme.components!.terminal.xterm.selectionBg ??=
      this._theme.colors.default.textSecondary;
    // Xterm cursor
    this._theme.components!.terminal.xterm.cursor ??= {};
    this._theme.components!.terminal.xterm.cursor.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.terminal.xterm.cursor.accentColor ??= this._theme
      .components!.terminal.default.bg as string;

    return this;
  }

  /** Set default bottom bar component */
  private static _bottom() {
    this._theme.components!.bottom ??= {};

    // Default
    this._theme.components!.bottom.default ??= {};
    this._theme.components!.bottom.default.bg ??=
      this._theme.colors.default.primary;
    this._theme.components!.bottom.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.bottom.default.padding ??= "0 0.5rem";
    this._theme.components!.bottom.default.fontSize ??=
      this._theme.font!.code!.size.small;

    // Connect button
    this._theme.components!.bottom.connect ??= {};
    this._theme.components!.bottom.connect.border ??= "none";
    this._theme.components!.bottom.connect.padding ??= "0 0.75rem";
    this._theme.components!.bottom.connect.hover ??= {};
    this._theme.components!.bottom.connect.hover.bg ??=
      this._theme.components!.bottom.default.color +
      this._theme.default!.transparency!.low;

    // Endpoint
    this._theme.components!.bottom.endpoint ??= {};

    // Address
    this._theme.components!.bottom.address ??= {};

    // Balance
    this._theme.components!.bottom.balance ??= {};

    return this;
  }

  /** Set default tutorial component */
  private static _tutorial() {
    this._theme.components!.tutorial ??= {};

    // Default
    this._theme.components!.tutorial.default ??= {};
    this._theme.components!.tutorial.default.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.tutorial.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.tutorial.default.flex ??= 1;
    this._theme.components!.tutorial.default.overflow ??= "auto";
    this._theme.components!.tutorial.default.opacity ??= 0;
    this._theme.components!.tutorial.default.transition ??= `opacity ${
      this._theme.default!.transition!.duration.medium
    } ${this._theme.default!.transition!.type}`;

    // About page
    this._theme.components!.tutorial.aboutPage ??= {};
    this._theme.components!.tutorial.aboutPage.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.tutorial.aboutPage.borderBottomRightRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.tutorial.aboutPage.borderTopRightRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.tutorial.aboutPage.fontFamily ??=
      this._theme.font!.other!.family;
    this._theme.components!.tutorial.aboutPage.fontSize ??=
      this._theme.font!.other!.size.medium;
    this._theme.components!.tutorial.aboutPage.padding ??= "2rem";
    this._theme.components!.tutorial.aboutPage.maxWidth ??= "60rem";

    // Tutorial page
    this._theme.components!.tutorial.tutorialPage ??= {};
    this._theme.components!.tutorial.tutorialPage.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.tutorial.tutorialPage.fontFamily ??=
      this._theme.font!.other!.family;
    this._theme.components!.tutorial.tutorialPage.fontSize ??=
      this._theme.font!.other!.size.medium;
    this._theme.components!.tutorial.tutorialPage.padding ??= "2rem";

    return this;
  }

  /** Set default tutorials component */
  private static _tutorials() {
    this._theme.components!.tutorials ??= {};

    // Default
    this._theme.components!.tutorials.default ??= {};
    this._theme.components!.tutorials.default.bg ??=
      this._theme.colors.default.bgSecondary;
    this._theme.components!.tutorials.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.tutorials.default.fontFamily ??=
      this._theme.font!.other!.family;
    this._theme.components!.tutorials.default.fontSize ??=
      this._theme.font!.other!.size.medium;

    // Card
    this._theme.components!.tutorials.card ??= {};
    // Card default
    this._theme.components!.tutorials.card.default ??= {};
    this._theme.components!.tutorials.card.default.bg ??=
      this._theme.colors.default.bgPrimary;
    this._theme.components!.tutorials.card.default.color ??=
      this._theme.colors.default.textPrimary;
    this._theme.components!.tutorials.card.default.border ??= `1px solid ${
      this._theme.colors.default.border +
      this._theme.default!.transparency!.medium
    }`;
    this._theme.components!.tutorials.card.default.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.tutorials.card.default.boxShadow ??=
      this._theme.default!.boxShadow;
    this._theme.components!.tutorials.card.default.transition ??= `all ${
      this._theme.default!.transition!.duration.medium
    }
      ${this._theme.default!.transition!.type}`;
    // Card gradient
    this._theme.components!.tutorials.card.gradient ??= {};
    // Card info
    this._theme.components!.tutorials.card.info ??= {};
    // Card info default
    this._theme.components!.tutorials.card.info.default ??= {};
    this._theme.components!.tutorials.card.info.default.padding ??=
      " 1rem 0.75rem";
    // Card info name
    this._theme.components!.tutorials.card.info.name ??= {};
    this._theme.components!.tutorials.card.info.name.fontWeight ??= "bold";
    // Card info description
    this._theme.components!.tutorials.card.info.description ??= {};
    this._theme.components!.tutorials.card.info.description.marginTop ??=
      "0.5rem";
    this._theme.components!.tutorials.card.info.description.color ??=
      this._theme.colors.default.textSecondary;
    // Card info category
    this._theme.components!.tutorials.card.info.category ??= {};
    this._theme.components!.tutorials.card.info.category.padding ??=
      "0.5rem 0.75rem";
    this._theme.components!.tutorials.card.info.category.bg ??=
      this._theme.components!.tutorials.default.bg;
    this._theme.components!.tutorials.card.info.category.color ??=
      this._theme.colors.default.textSecondary;
    this._theme.components!.tutorials.card.info.category.fontSize ??=
      this._theme.font!.other!.size.small;
    this._theme.components!.tutorials.card.info.category.fontWeight ??= "bold";
    this._theme.components!.tutorials.card.info.category.borderRadius ??=
      this._theme.default!.borderRadius;
    this._theme.components!.tutorials.card.info.category.boxShadow ??=
      this._theme.default!.boxShadow;
    this._theme.components!.tutorials.card.info.category.width ??=
      "fit-content";

    return this;
  }
}
