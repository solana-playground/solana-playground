import type { StandardProperties } from "csstype";

import { PgCommon } from "../common";
import { EventName } from "../../../constants";
import type {
  DefaultComponent,
  ImportableTheme,
  Font,
  ThemeInternal,
  ThemeReady,
  ThemeColor,
  Highlight,
} from "./interface";
import type { ValueOf } from "../types";

export class PgTheme {
  /** Current theme */
  private static _theme: ThemeInternal;

  /** Current font */
  private static _font: Font;

  /** All themes */
  private static _themes: ImportableTheme[];

  /** All fonts */
  private static _fonts: Font[];

  /** Theme key in localStorage */
  private static readonly _THEME_KEY = "theme";

  /** Font key in localStorage */
  private static readonly _FONT_KEY = "font";

  /** All available themes */
  static get themes() {
    return this._themes;
  }

  /** All available fonts */
  static get fonts() {
    return this._fonts;
  }

  /**
   * Create the initial theme and font from `localStorage`.
   *
   * @param themes all importable themes
   * @param fonts all fonts
   */
  static async create(themes: ImportableTheme[], fonts: Font[]) {
    this._themes = themes;
    this._fonts = fonts;
    await this.set();
  }

  /**
   * Add fallback fonts.
   *
   * @param family font family
   * @returns the font family with fallback fonts appended
   */
  static addFallbackFont(family: string) {
    return `${family}, Monospace, Courier`;
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
      themeName: ThemeInternal["name"];
      fontFamily: Font["family"];
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
      ._text()
      ._input()
      ._select()
      ._tooltip()
      ._progressBar()
      ._uploadArea()
      ._toast()
      ._modal()
      ._markdown()
      ._terminal()
      ._wallet()
      ._bottom()
      ._sidebar()
      ._main()
      ._tabs()
      ._editor()
      ._home()
      ._tutorial()
      ._tutorials()
      ._programs();

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
    return Object.keys(component).reduce((acc, key) => {
      const value = component[key];

      // Check for `&`
      if (key.startsWith("&")) {
        return `${acc}${key}{${this.convertToCSS(value)}}`;
      }

      // Handle non-standard properties
      let prop = key.startsWith("-") ? key : PgCommon.toKebabFromCamel(key);
      switch (key) {
        case "bg":
          prop = "background";
          break;

        case "hover":
        case "active":
        case "focus":
        case "focusWithin":
          return `${acc}&:${prop}{${this.convertToCSS(value)}}`;

        case "before":
        case "after":
          return `${acc}&::${prop}{${this.convertToCSS(value)}}`;
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

  /**
   * Get the color value from the given theme color name.
   *
   * @param color theme color
   * @returns the color value from theme
   */
  static getColor(color: ThemeColor = "textSecondary") {
    const theme = this._themeReady;

    switch (color) {
      case "primary":
        return theme.colors.default.primary;
      case "secondary":
        return theme.colors.default.secondary;
      case "error":
        return theme.colors.state.error.color;
      case "success":
        return theme.colors.state.success.color;
      case "warning":
        return theme.colors.state.warning.color;
      case "info":
        return theme.colors.state.info.color;
      case "textPrimary":
        return theme.colors.default.textPrimary;
      case "textSecondary":
        return theme.colors.default.textSecondary;
      default:
        throw new Error(`Unknown color '${color}'`);
    }
  }

  /**
   * Get a different background than the one given based on the current theme.
   *
   * @param bg background to compare to
   * @returns a different background based on the current theme
   */
  static getDifferentBackground(bg: string) {
    const theme = this._themeReady;

    const textBg = theme.components.text.default.bg!;
    if (!PgCommon.isColorsEqual(bg, textBg)) return textBg;

    const { bgPrimary, bgSecondary } = theme.colors.default;
    if (PgCommon.isColorsEqual(bg, bgPrimary)) return bgSecondary;
    return bgPrimary;
  }

  /**
   * Create CSS for scrollbar.
   *
   * @param opts -
   * `allChildren`: Whether to add the scrollbar changes to all children components
   * @returns the scrollbar CSS
   */
  static getScrollbarCSS(
    opts?: {
      allChildren?: boolean;
    } & Pick<StandardProperties, "width" | "height" | "borderRadius">
  ) {
    const theme = this._themeReady;
    const scrollbar = theme.default.scrollbar;

    const { allChildren, borderRadius, height, width } = PgCommon.setDefault(
      opts,
      {
        allChildren: false,
        borderRadius: theme.default.borderRadius,
        height: "0.5rem",
        width: "0.5rem",
      }
    );
    const prefix = allChildren ? "& " : "&";

    return `
    /* Scrollbar */
    /* Chromium */
    ${prefix}::-webkit-scrollbar {
      width: ${width};
      height: ${height};
    }

    ${prefix}::-webkit-scrollbar-track {
      background-color: transparent;
    }

    ${prefix}::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${borderRadius};
      background-color: ${scrollbar.thumb.color};
    }

    ${prefix}::-webkit-scrollbar-thumb:hover {
      background-color: ${scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    ${prefix} * {
      scrollbar-color: ${scrollbar.thumb.color};
    }
`;
  }

  /**
   * Clamp the lines i.e. hide all lines after `max` and append "..." to the
   * text.
   *
   * @param max maximum number of lines
   * @returns the CSS string
   */
  static getClampLinesCSS(max: number) {
    return `
      display: -webkit-box;
      -webkit-line-clamp: ${max};
      -webkit-box-orient: vertical;
      overflow: hidden;
    `;
  }

  /**
   * Convert playground theme to a TextMate theme.
   *
   * @param theme ready theme
   * @returns the converted TextMate theme
   */
  static convertToTextMateTheme(theme: ThemeReady) {
    const editorStyles = theme.components.editor;
    const hl = theme.highlight;

    const createSettings = (token: ValueOf<Highlight>) => ({
      foreground: token.color,
      fontStyle: token.fontStyle,
    });

    return {
      name: theme.name,
      settings: [
        //////////////////////////////// Default ///////////////////////////////
        {
          // Can't directly set scrollbar background.
          // See https://github.com/microsoft/monaco-editor/issues/908#issuecomment-433739458
          name: "Defaults",

          settings: {
            background:
              // Transparent background results with a full black background
              editorStyles.default.bg === "transparent"
                ? theme.colors.default.bgPrimary
                : editorStyles.default.bg,
            foreground: editorStyles.default.color,
          },
        },

        //////////////////////////////// Boolean ///////////////////////////////
        {
          name: "Boolean",
          scope: [
            "constant.language.bool",
            "constant.language.boolean",
            "constant.language.json",
          ],
          settings: createSettings(hl.bool),
        },

        /////////////////////////////// Integer ////////////////////////////////
        {
          name: "Integers",
          scope: "constant.numeric",
          settings: createSettings(hl.integer),
        },

        //////////////////////////////// String ////////////////////////////////
        {
          name: "Strings",
          scope: [
            "string.quoted.single",
            "string.quoted.double",
            "string.template.ts",
          ],
          settings: createSettings(hl.string),
        },

        ///////////////////////////////// Regex ////////////////////////////////
        {
          name: "Regular expressions",
          scope: ["string.regexp.ts"],
          settings: createSettings(hl.regexp),
        },

        /////////////////////////////// Function ///////////////////////////////
        {
          name: "Functions",
          scope: ["entity.name.function", "meta.function-call.generic.python"],
          settings: createSettings(hl.functionCall),
        },
        {
          name: "Function parameter",
          scope: [
            "variable.parameter",
            "variable.parameter.ts",
            "entity.name.variable.parameter",
            "variable.other.jsdoc",
          ],
          settings: createSettings(hl.functionArg),
        },

        /////////////////////////////// Constant ///////////////////////////////
        {
          name: "Constants",
          scope: [
            "variable.other.constant.ts",
            "variable.other.constant.property.ts",
          ],
          settings: createSettings(hl.constant),
        },

        /////////////////////////////// Variable ///////////////////////////////
        {
          name: "Variables",
          scope: [
            "variable.other",
            "variable.object.property.ts",
            "meta.object-literal.key.ts",
          ],
          settings: createSettings(hl.variableName),
        },
        {
          name: "Special variable",
          scope: [
            "variable.language.self.rust",
            "variable.language.super.rust",
            "variable.language.this.ts",
          ],
          settings: createSettings(hl.specialVariable),
        },

        //////////////////////////////// Keyword ///////////////////////////////
        {
          name: "Storage types",
          scope: "storage.type",
          settings: createSettings(hl.keyword),
        },
        {
          name: "Storage modifiers",
          scope: "storage.modifier",
          settings: createSettings(hl.modifier),
        },
        {
          name: "Control keywords",
          scope: "keyword.control",
          settings: createSettings(hl.controlKeyword),
        },
        {
          name: "Other",
          scope: ["keyword.other", "keyword.operator.new.ts"],
          settings: createSettings(hl.keyword),
        },

        /////////////////////////////// Operator ///////////////////////////////
        {
          name: "Operators",
          scope: [
            "keyword.operator",
            "punctuation.separator.key-value",
            "storage.type.function.arrow.ts",
          ],
          settings: createSettings(hl.operator),
        },

        ///////////////////////////////// Type /////////////////////////////////
        {
          name: "Types",
          scope: [
            "entity.name.type",
            "support.type",
            "entity.other.inherited-class.python",
          ],
          settings: createSettings(hl.typeName),
        },

        ////////////////////////////// Punctuation /////////////////////////////
        {
          name: ".",
          scope: ["punctuation.accessor", "punctuation.separator.period"],
          settings: createSettings(hl.operator),
        },
        {
          name: ",",
          scope: "punctuation.separator.comma",
          settings: createSettings(hl.variableName),
        },
        {
          name: ";",
          scope: "punctuation.terminator.statement",
          settings: createSettings(hl.variableName),
        },
        {
          name: "${}",
          scope: [
            "punctuation.definition.template-expression.begin.ts",
            "punctuation.definition.template-expression.end.ts",
          ],
          settings: createSettings(hl.modifier),
        },

        //////////////////////////////// Import ////////////////////////////////
        {
          name: "`import`",
          scope: "keyword.control.import.ts",
          settings: createSettings(hl.keyword),
        },
        {
          name: "import `*`",
          scope: "constant.language.import-export-all.ts",
          settings: createSettings(hl.constant),
        },
        {
          name: "import * `as`",
          scope: "keyword.control.as.ts",
          settings: createSettings(hl.controlKeyword),
        },
        {
          name: "import * as `alias`",
          scope: "variable.other.readwrite.alias.ts",
          settings: createSettings(hl.variableName),
        },
        {
          name: "import * as alias `from`",
          scope: "keyword.control.from.ts",
          settings: createSettings(hl.keyword),
        },

        //////////////////////////////// Macros ////////////////////////////////
        {
          name: "Macros",
          scope: [
            "meta.attribute.rust",
            "entity.name.function.decorator.python",
          ],
          settings: createSettings(hl.meta),
        },

        //////////////////////////////// Comment ///////////////////////////////
        {
          name: "Comments",
          scope: [
            "comment.line",
            "comment.block",
            "punctuation.definition.comment.ts",
          ],
          settings: createSettings(hl.lineComment),
        },
        {
          name: "JSDoc comments",
          scope: [
            "punctuation.definition.block.tag.jsdoc",
            "storage.type.class.jsdoc",
          ],
          settings: createSettings(hl.keyword),
        },

        ///////////////////////////////// Rust /////////////////////////////////
        {
          name: "Lifetimes",
          scope: [
            "punctuation.definition.lifetime.rust",
            "entity.name.type.lifetime.rust",
          ],
          settings: createSettings(hl.specialVariable),
        },
      ],
    };
  }

  /** Get the theme with default types set */
  private static get _themeReady() {
    return this._theme as ThemeReady;
  }

  /** Get and initialize component and return it with the correct type */
  private static _getComponent<
    T extends keyof NonNullable<ThemeInternal["components"]>
  >(component: T): NonNullable<NonNullable<ThemeInternal["components"]>[T]> {
    const components = this._theme.components!;
    components[component] ??= {};

    return components[component]!;
  }

  /** Set default fonts */
  private static _theme_fonts() {
    this._theme.font ??= {};
    this._theme.font.code ??= {
      ...this._font,
      family: this.addFallbackFont(this._font.family),
    };
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
    const def = this._theme.default;

    // Backdrop
    def.backdrop ??= {};
    def.backdrop.bg ??= this._theme.isDark ? "#00000080" : "#00000040";

    // Border radius
    def.borderRadius ??= "4px";

    // Box shadow
    def.boxShadow ??= "rgb(0 0 0 / 25%) -1px 3px 4px";

    // Scrollbar
    if (!def.scrollbar) {
      if (this._theme.isDark) {
        def.scrollbar = {
          thumb: {
            color: "#ffffff64",
            hoverColor: "#ffffff32",
          },
        };
      } else {
        def.scrollbar = {
          thumb: {
            color: "#00000032",
            hoverColor: "#00000064",
          },
        };
      }
    }

    // Transition
    def.transition ??= {
      type: "linear",
      duration: {
        short: "50ms",
        medium: "150ms",
        long: "250ms",
      },
    };

    // Transparency
    def.transparency ??= {
      low: "16",
      medium: "64",
      high: "bb",
    };

    return this;
  }

  /** Set default state colors */
  private static _stateColors() {
    const state = this._theme.colors.state;
    const theme = this._themeReady;

    state.disabled.bg ??= state.disabled.color + theme.default.transparency.low;
    state.error.bg ??= state.error.color + theme.default.transparency.low;
    state.hover.bg ??= state.hover.color + theme.default.transparency.low;
    state.info.bg ??= state.info.color + theme.default.transparency.low;
    state.success.bg ??= state.success.color + theme.default.transparency.low;
    state.warning.bg ??= state.warning.color + theme.default.transparency.low;

    return this;
  }

  /** Set default components */
  private static _components() {
    this._theme.components ??= {};

    return this;
  }

  /** Set default skeleton component */
  private static _skeleton() {
    const skeleton = this._getComponent("skeleton");
    const theme = this._themeReady;

    skeleton.bg ??= "#44475A";
    skeleton.highlightColor ??= "#343746";
    skeleton.borderRadius ??= theme.default.borderRadius;

    return this;
  }

  /** Set default button component */
  private static _button() {
    const button = this._getComponent("button");
    const theme = this._themeReady;

    // Default
    button.default ??= {};
    button.default.bg ??= "transparent";
    button.default.color ??= "inherit";
    button.default.borderColor ??= "transparent";
    button.default.borderRadius ??= theme.default.borderRadius;
    button.default.fontSize ??= theme.font.code.size.medium;
    button.default.fontWeight ??= "normal";
    button.default.hover ??= {};

    return this;
  }

  /** Set default menu component */
  private static _menu() {
    const menu = this._getComponent("menu");
    const theme = this._themeReady;

    // Default
    menu.default ??= {};
    menu.default.position ??= "absolute";
    menu.default.zIndex ??= 2;
    menu.default.bg ??= theme.colors.default.bgPrimary;
    menu.default.borderRadius ??= theme.default.borderRadius;
    menu.default.padding ??= "0.25rem 0";
    menu.default.boxShadow ??= theme.default.boxShadow;

    return this;
  }

  /** Set default menu component */
  private static _text() {
    const text = this._getComponent("text");
    const theme = this._themeReady;

    // Default
    text.default ??= {};
    text.default.display ??= "flex";
    text.default.justifyContent ??= "center";
    text.default.alignItems ??= "center";
    text.default.bg ??= theme.colors.default.bgPrimary;
    text.default.padding ??= "1rem";
    text.default.borderRadius ??= theme.default.borderRadius;
    text.default.fontSize ??= theme.font.code.size.small;
    text.default.lineHeight ??= 1.5;

    return this;
  }

  /** Set default input component */
  private static _input() {
    const input = this._getComponent("input");
    const theme = this._themeReady;

    input.width ??= "100%";
    input.height ??= "2rem";
    input.padding ??= "0.375rem 0.5rem";
    input.bg ??= theme.colors.default.bgPrimary;
    input.color ??= theme.colors.default.textPrimary;
    input.border ??= `1px solid ${theme.colors.default.border}`;
    input.borderColor ??= theme.colors.default.border; // Monaco inputs also use this
    input.borderRadius ??= theme.default.borderRadius;
    input.boxShadow ??= "none";
    input.fontWeight ??= "normal";
    input.fontSize ??= theme.font.code.size.medium;

    input.focus ??= {};
    input.focus.outline ??= `1px solid ${
      theme.colors.default.primary + theme.default.transparency.medium
    }`;

    input.focusWithin ??= {};
    input.focusWithin.outline ??= `1px solid ${
      theme.colors.default.primary + theme.default.transparency.medium
    }`;

    return this;
  }

  /** Set default select component */
  private static _select() {
    const select = this._getComponent("select");
    const theme = this._themeReady;
    const input = theme.components.input;

    // Default
    select.default ??= {};
    select.default.fontSize ??= theme.font.code.size.small;

    // Control
    select.control ??= {};
    select.control.bg ??= input.bg;
    select.control.borderColor ??= theme.colors.default.border;
    select.control.borderRadius ??= theme.default.borderRadius;
    select.control.minHeight ??= "fit-content";
    select.control.hover ??= {};
    select.control.hover.borderColor ??= theme.colors.state.hover.color;
    select.control.hover.cursor ??= "pointer";
    select.control.focusWithin ??= {};
    select.control.focusWithin.boxShadow ??= `0 0 0 1px ${
      theme.colors.default.primary + theme.default.transparency.high
    }`;

    // Menu
    select.menu ??= {};
    select.menu.bg ??= input.bg;
    select.menu.color ??= input.color;
    select.menu.borderRadius ??= input.borderRadius;

    // Option
    select.option ??= {};
    select.option.bg ??= input.bg;
    select.option.color ??= theme.colors.default.textSecondary;
    select.option.cursor ??= "pointer";
    // Option::before
    select.option.before ??= {};
    select.option.before.color ??= theme.colors.default.primary;
    // Option:focus
    select.option.focus ??= {};
    select.option.focus.bg ??= theme.colors.state.hover.bg;
    select.option.focus.color ??= theme.colors.default.primary;
    // Option:active
    select.option.active ??= {};
    select.option.active.bg ??= theme.colors.state.hover.bg;

    // Single Value
    select.singleValue ??= {};
    select.singleValue.bg ??= input.bg;
    select.singleValue.color ??= input.color;

    // Input
    select.input ??= {};
    select.input.color ??= input.color;

    // Group Heading
    select.groupHeading ??= {};
    select.groupHeading.color ??= theme.colors.default.textSecondary;

    // Dropdown Indicator
    select.dropdownIndicator ??= {};
    select.dropdownIndicator.padding ??= "0.25rem";

    // Indicator Separator
    select.indicatorSeparator ??= {};
    select.indicatorSeparator.bg ??= theme.colors.default.textSecondary;

    return this;
  }

  /** Set default tooltip component */
  private static _tooltip() {
    const tooltip = this._getComponent("tooltip");
    const theme = this._themeReady;

    tooltip.padding ??= "0.375rem 0.5rem";
    tooltip.bg ??= theme.colors.default.bgPrimary;
    tooltip.bgSecondary ??= theme.colors.default.bgSecondary;
    tooltip.color ??= theme.colors.default.textPrimary;
    tooltip.borderRadius ??= theme.default.borderRadius;
    tooltip.boxShadow ??= theme.default.boxShadow;
    tooltip.fontFamily ??= theme.font.code.family;
    tooltip.fontSize ??= theme.font.code.size.small;
    tooltip.textAlign ??= "center";

    return this;
  }

  /** Set default progress bar component */
  private static _progressBar() {
    const progressbar = this._getComponent("progressbar");
    const theme = this._themeReady;

    // Default
    progressbar.default ??= {};
    progressbar.default.width ??= "100%";
    progressbar.default.height ??= "0.75rem";
    progressbar.default.overflow ??= "hidden";
    progressbar.default.border ??= `1px solid ${theme.colors.default.border}`;
    progressbar.default.borderRadius ??= theme.default.borderRadius;

    // Indicator
    progressbar.indicator ??= {};
    progressbar.indicator.height ??= "100%";
    progressbar.indicator.maxWidth ??= "100%";
    progressbar.indicator.bg ??= theme.colors.default.primary;
    progressbar.indicator.borderRadius ??= theme.default.borderRadius;
    progressbar.indicator.transition ??= `width ${theme.default.transition.duration.long} ${theme.default.transition.type}`;

    return this;
  }

  /** Set default upload area component */
  private static _uploadArea() {
    const uploadArea = this._getComponent("uploadArea");
    const theme = this._themeReady;

    // Default
    uploadArea.default ??= {};
    uploadArea.default.padding ??= "2rem";
    uploadArea.default.bg ??=
      theme.colors.default.primary + theme.default.transparency.low;
    uploadArea.default.border ??= `2px dashed
    ${theme.colors.default.primary + theme.default.transparency.medium}`;
    uploadArea.default.borderRadius ??= theme.default.borderRadius;
    uploadArea.default.transition ??= `all ${theme.default.transition.duration.short}
      ${theme.default.transition.type}`;
    uploadArea.default.hover ??= {};
    uploadArea.default.hover.cursor ??= "pointer";
    uploadArea.default.hover.borderColor ??=
      theme.colors.default.primary + theme.default.transparency.high;

    // Icon
    uploadArea.icon ??= {};
    uploadArea.icon.width ??= "4rem";
    uploadArea.icon.height ??= "4rem";
    uploadArea.icon.color ??= theme.colors.default.primary;

    // Text
    uploadArea.text ??= {};
    // Text default
    uploadArea.text.default ??= {};
    uploadArea.text.default.marginTop ??= "1rem";
    uploadArea.text.default.color ??= theme.colors.default.textSecondary;
    uploadArea.text.default.fontWeight ??= "bold";
    // Text error
    uploadArea.text.error ??= {};
    uploadArea.text.error.color ??= theme.colors.state.error.color;
    // Text success
    uploadArea.text.success ??= {};
    uploadArea.text.success.color ??= theme.colors.default.primary;

    return this;
  }

  /** Set default skeleton component */
  private static _toast() {
    const toast = this._getComponent("toast");
    const theme = this._themeReady;

    // Default
    toast.default ??= {};
    toast.default.bg ??= theme.colors.default.bgPrimary;
    toast.default.color ??= theme.colors.default.textPrimary;
    toast.default.borderRadius ??= theme.default.borderRadius;
    toast.default.fontFamily ??= theme.font.code.family;
    toast.default.fontSize ??= theme.font.code.size.medium;
    toast.default.cursor ??= "default";

    // Progress bar
    toast.progress ??= {};
    toast.progress.bg ??= theme.colors.default.primary;

    // Close button
    toast.closeButton ??= {};
    toast.closeButton.color ??= theme.colors.default.textSecondary;

    return this;
  }

  /** Set default modal component */
  private static _modal() {
    const modal = this._getComponent("modal");
    const theme = this._themeReady;

    // Default
    modal.default ??= {};
    modal.default.display ??= "flex";
    modal.default.flexDirection ??= "column";
    modal.default.bg ??= theme.colors.default.bgPrimary;
    modal.default.border ??= `1px solid ${theme.colors.default.border}`;
    modal.default.borderRadius ??= theme.default.borderRadius;
    modal.default.maxWidth ??= "max(40%, 40rem)";
    modal.default.maxHeight ??= "max(80%, 40rem)";

    // Backdrop
    modal.backdrop ??= theme.default.backdrop;

    // Top
    modal.top ??= {};
    modal.top.position ??= "relative";
    modal.top.display ??= "flex";
    modal.top.justifyContent ??= "center";
    modal.top.alignItems ??= "center";
    modal.top.padding ??= "0 1.5rem";
    modal.top.fontWeight ??= "bold";

    // Content
    modal.content ??= {};
    modal.content.padding ??= "1rem 1.5rem";
    modal.content.minWidth ??= "23rem";
    modal.content.minHeight ??= "3rem";

    // Bottom
    modal.bottom ??= {};
    modal.bottom.display ??= "flex";
    modal.bottom.justifyContent ??= "flex-end";
    modal.bottom.padding ??= "0.25rem 1.5rem 0.75rem";
    modal.bottom.marginBottom ??= "0.25rem";

    return this;
  }

  /** Set default markdown component */
  private static _markdown() {
    const markdown = this._getComponent("markdown");
    const theme = this._themeReady;

    // Default
    markdown.bg ??= "inherit";
    markdown.subtleBg ??= theme.colors.default.bgSecondary;
    markdown.color ??= theme.colors.default.textPrimary;
    markdown.fontFamily ??= theme.font.other.family;
    markdown.fontSize ??= theme.font.other.size.medium;

    return this;
  }

  /** Set default terminal component */
  private static _terminal() {
    const terminal = this._getComponent("terminal");
    const theme = this._themeReady;

    // Default
    terminal.default ??= {};
    terminal.default.padding ??= "0.5rem 1rem";

    // Xterm
    terminal.xterm ??= {};
    terminal.xterm.textPrimary ??= theme.colors.default.textPrimary;
    terminal.xterm.textSecondary ??= theme.colors.default.textSecondary;
    terminal.xterm.primary ??= theme.colors.default.primary;
    terminal.xterm.secondary ??= theme.colors.default.secondary;
    terminal.xterm.success ??= theme.colors.state.success.color;
    terminal.xterm.error ??= theme.colors.state.error.color;
    terminal.xterm.warning ??= theme.colors.state.warning.color;
    terminal.xterm.info ??= theme.colors.state.info.color;
    terminal.xterm.selectionBg ??= theme.colors.default.textSecondary;
    // Xterm cursor
    terminal.xterm.cursor ??= {};
    terminal.xterm.cursor.color ??= theme.colors.default.textPrimary;
    terminal.xterm.cursor.accentColor ??= terminal.default.bg!;

    return this;
  }

  /** Set default wallet component */
  private static _wallet() {
    const wallet = this._getComponent("wallet");
    const theme = this._themeReady;

    // Default
    wallet.default ??= {};
    wallet.default.width ??= "100%";
    wallet.default.height ??= "100%";
    wallet.default.bg ??= theme.colors.default.bgSecondary;
    wallet.default.border ??= `1px solid ${theme.colors.default.border}`;
    wallet.default.borderRadius ??= theme.default.borderRadius;
    wallet.default.boxShadow ??= theme.default.boxShadow;

    // Top
    wallet.top ??= {};
    // Top default
    wallet.top.default ??= {};
    wallet.top.default.position ??= "relative";
    wallet.top.default.height ??= "2rem";
    wallet.top.default.display ??= "flex";
    wallet.top.default.justifyContent ??= "center";
    wallet.top.default.alignItems ??= "center";
    wallet.top.default.padding ??= "0.5rem";
    // Top title
    wallet.top.title ??= {};
    // Top title default
    wallet.top.title.default ??= {};
    wallet.top.title.default.display ??= "flex";
    wallet.top.title.default.justifyContent ??= "center";
    wallet.top.title.default.alignItems ??= "center";
    wallet.top.title.default.hover ??= {};
    wallet.top.title.default.hover.cursor ??= "pointer";
    wallet.top.title.default.hover[`& svg, & span`] = {
      color: theme.colors.default.textPrimary,
    };
    // Top title icon
    wallet.top.title.icon ??= {};
    wallet.top.title.icon.width ??= "1rem";
    wallet.top.title.icon.height ??= "1rem";
    wallet.top.title.icon.marginRight ??= "0.25rem";
    // Top title text
    wallet.top.title.text ??= {};
    wallet.top.title.text.display ??= "flex";
    wallet.top.title.text.alignItems ??= "center";
    wallet.top.title.text.padding ??= "0.25rem";
    wallet.top.title.text.color ??= theme.colors.default.textSecondary;
    wallet.top.title.text.fontSize ??= theme.font.code.size.small;
    wallet.top.title.text.fontWeight ??= "bold";
    wallet.top.title.text.transition ??= `all ${theme.default.transition.duration.short} ${theme.default.transition.type}`;

    // Main
    wallet.main ??= {};

    // Main default
    wallet.main.default ??= {};
    wallet.main.default.position ??= "relative";
    wallet.main.default.cursor ??= "auto";
    wallet.main.default.padding ??= "1rem";
    wallet.main.default.bg ??= `linear-gradient(
      0deg,
      ${wallet.default.bg} 75%,
      ${theme.colors.default.primary + theme.default.transparency.low} 100%
    )`;
    wallet.main.default.borderRadius ??= theme.default.borderRadius;

    // Main backdrop
    wallet.main.backdrop ??= theme.default.backdrop;

    // Main balance
    wallet.main.balance ??= {};
    wallet.main.balance.display ??= "flex";
    wallet.main.balance.justifyContent ??= "center";
    wallet.main.balance.marginBottom ??= "0.5rem";
    wallet.main.balance.color ??= theme.colors.default.textSecondary;
    wallet.main.balance.fontWeight ??= "bold";
    wallet.main.balance.fontSize ??= theme.font.code.size.xlarge;

    // Main send
    wallet.main.send ??= {};
    // Main send default
    wallet.main.send.default ??= {};
    wallet.main.send.default.marginBottom ??= "1rem";
    // Main send title
    wallet.main.send.title ??= {};
    wallet.main.send.title.fontWeight ??= "bold";
    // Main send expanded
    wallet.main.send.expanded ??= {};
    // Main send expanded default
    wallet.main.send.expanded.default ??= {};
    wallet.main.send.expanded.default.paddingTop ??= "0.75rem";
    // Main send expanded input
    wallet.main.send.expanded.input ??= {};
    wallet.main.send.expanded.input.marginBottom ??= "0.75rem";
    // Main send expanded button
    wallet.main.send.expanded.sendButton ??= {};
    wallet.main.send.expanded.sendButton.marginBottom ??= "0.25rem";

    // Main transactions
    wallet.main.transactions ??= {};
    // Main transactions default
    wallet.main.transactions.default ??= {};
    // Main transactions title
    wallet.main.transactions.title ??= {};
    // Main transactions title default
    wallet.main.transactions.title.default ??= {};
    wallet.main.transactions.title.default.display ??= "flex";
    wallet.main.transactions.title.default.justifyContent ??= "space-between";
    wallet.main.transactions.title.default.alignItems ??= "center";
    // Main transactions title text
    wallet.main.transactions.title.text ??= {};
    wallet.main.transactions.title.text.fontWeight ??= "bold";
    // Main transactions title button
    wallet.main.transactions.title.refreshButton ??= {};
    wallet.main.transactions.title.refreshButton.marginRight ??= "0.5rem";
    // Main transactions table
    wallet.main.transactions.table ??= {};
    // Main transactions table default
    wallet.main.transactions.table.default ??= {};
    wallet.main.transactions.table.default.bg ??=
      theme.colors.default.bgPrimary;
    wallet.main.transactions.table.default.border ??= `1px solid ${theme.colors.default.border}`;
    wallet.main.transactions.table.default.borderRadius ??=
      theme.default.borderRadius;
    wallet.main.transactions.table.default.marginTop ??= "0.5rem";
    wallet.main.transactions.table.default.overflow ??= "hidden";
    // Main transactions table header
    wallet.main.transactions.table.header ??= {};
    wallet.main.transactions.table.header.display ??= "flex";
    wallet.main.transactions.table.header.padding ??= "0.5rem 1rem";
    wallet.main.transactions.table.header.bg ??=
      theme.colors.default.bgSecondary;
    wallet.main.transactions.table.header.color ??=
      theme.colors.default.textSecondary;
    wallet.main.transactions.table.header.borderBottom ??= `1px solid ${theme.colors.default.border}`;
    wallet.main.transactions.table.header.fontWeight ??= "bold";
    wallet.main.transactions.table.header.fontSize ??=
      theme.font.code.size.small;
    // Main transactions table row
    wallet.main.transactions.table.row ??= {};
    // Main transactions table row default
    wallet.main.transactions.table.row.default ??= {};
    wallet.main.transactions.table.row.default.display ??= "flex";
    wallet.main.transactions.table.row.default.padding ??= "0.5rem 1rem";
    wallet.main.transactions.table.row.default.color ??=
      theme.colors.default.textSecondary;
    wallet.main.transactions.table.row.default.fontSize ??=
      theme.font.code.size.small;
    wallet.main.transactions.table.row.default.hover ??= {};
    wallet.main.transactions.table.row.default.hover.bg ??=
      theme.colors.state.hover.bg;
    wallet.main.transactions.table.row.default.hover.color ??=
      theme.colors.default.textPrimary;
    // Main transactions table row signature
    wallet.main.transactions.table.row.signature ??= {};
    wallet.main.transactions.table.row.signature.display ??= "flex";
    wallet.main.transactions.table.row.signature.alignItems ??= "center";
    wallet.main.transactions.table.row.signature.width ??= "40%";
    // Main transactions table row slot
    wallet.main.transactions.table.row.slot ??= {};
    wallet.main.transactions.table.row.slot.width ??= "40%";
    // Main transactions table row time
    wallet.main.transactions.table.row.time ??= {};
    wallet.main.transactions.table.row.time.display ??= "flex";
    wallet.main.transactions.table.row.time.justifyContent ??= "flex-end";
    wallet.main.transactions.table.row.time.alignItems ??= "center";
    wallet.main.transactions.table.row.time.width ??= "20%";

    return this;
  }

  /** Set default bottom bar component */
  private static _bottom() {
    const bottom = this._getComponent("bottom");
    const theme = this._themeReady;

    // Default
    bottom.default ??= {};
    bottom.default.height ??= "1.5rem";
    bottom.default.padding ??= "0 0.5rem";
    bottom.default.bg ??= theme.colors.default.primary;
    bottom.default.color ??= theme.colors.default.textPrimary;
    bottom.default.fontSize ??= theme.font.code.size.small;
    bottom.default.display ??= "flex";
    bottom.default.flexWrap ??= "wrap";
    bottom.default.alignItems ??= "center";

    // Connect button
    bottom.connect ??= {};
    bottom.connect.height ??= "100%";
    bottom.connect.padding ??= "0 0.75rem";
    bottom.connect.border ??= "none";
    bottom.connect.hover ??= {};
    bottom.connect.hover.bg ??=
      bottom.default.color + theme.default.transparency.low;

    // Endpoint
    bottom.endpoint ??= {};

    // Address
    bottom.address ??= {};
    bottom.address.color ??= bottom.default.color;

    // Balance
    bottom.balance ??= {};

    return this;
  }

  /** Set default sidebar component */
  private static _sidebar() {
    const sidebar = this._getComponent("sidebar");
    const theme = this._themeReady;

    // Default
    sidebar.default ??= {};
    sidebar.default.display ??= "flex";

    // Left
    sidebar.left ??= {};
    // Left default
    sidebar.left.default ??= {};
    sidebar.left.default.width ??= "3rem";
    sidebar.left.default.bg ??= theme.colors.default.bgPrimary;
    sidebar.left.default.borderRight ??= `1px solid ${theme.colors.default.border}`;

    // Left icon button
    sidebar.left.button ??= {};
    // Left icon button default
    sidebar.left.button.default ??= {};
    sidebar.left.button.default.display ??= "flex";
    sidebar.left.button.default.justifyContent ??= "center";
    sidebar.left.button.default.alignItems ??= "center";
    sidebar.left.button.default.width ??= sidebar.left.default.width;
    sidebar.left.button.default.height ??= "3rem";
    sidebar.left.button.default.cursor ??= "pointer";

    // Left icon button selected
    sidebar.left.button.selected ??= {};
    sidebar.left.button.selected.bg ??= theme.colors.state.hover.bg;
    sidebar.left.button.selected.borderLeft ??= `2px solid ${theme.colors.default.secondary}`;
    sidebar.left.button.selected.borderRight ??= "2px solid transparent";

    // Right
    sidebar.right ??= {};
    // Right default
    sidebar.right.default ??= {};
    sidebar.right.default.initialWidth ??= "20rem";
    sidebar.right.default.bg ??= theme.colors.default.bgSecondary;
    sidebar.right.default.otherBg ??= theme.colors.default.bgPrimary;
    sidebar.right.default.borderRight ??= `1px solid ${theme.colors.default.border}`;
    // Right title
    sidebar.right.title ??= {};
    sidebar.right.title.height ??= "2rem";
    sidebar.right.title.borderBottom ??= `1px solid ${theme.colors.default.border};`;
    sidebar.right.title.color ??= theme.colors.default.textSecondary;
    sidebar.right.title.fontSize ??= theme.font.code.size.large;

    return this;
  }

  /** Set default main view */
  private static _main() {
    const main = this._getComponent("main");
    const theme = this._themeReady;

    // Default
    main.default ??= {};
    main.default.display ??= "flex";
    main.default.flexDirection ??= "column";
    main.default.overflow ??= "hidden";
    main.default.bg ??= theme.colors.default.bgSecondary;
    main.default.color ??= theme.colors.default.textPrimary;

    // Main primary
    main.primary ??= {};
    // Main top default
    main.primary.default ??= {};
    main.primary.default.flex ??= "1";
    main.primary.default.minHeight ??= 0;

    // Main secondary
    main.secondary ??= {};
    // Main secondary default
    main.secondary.default ??= {};
    main.secondary.default.height ??= "100%";
    main.secondary.default.bg ??= theme.colors.default.bgPrimary;
    main.secondary.default.color ??= theme.colors.default.textPrimary;
    main.secondary.default.borderTop ??= `1px solid ${theme.colors.default.primary};`;

    return this;
  }

  /** Set default tabs component */
  private static _tabs() {
    const tabs = this._getComponent("tabs");
    const theme = this._themeReady;

    // Default
    tabs.default ??= {};
    tabs.default.display ??= "flex";
    tabs.default.justifyContent ??= "space-between";
    tabs.default.userSelect ??= "none";
    tabs.default.bg ??= theme.components.main.default.bg;
    tabs.default.borderBottom ??= `1px solid ${theme.colors.default.border}`;
    tabs.default.fontSize ??= theme.font.code.size.small;

    // Tab
    tabs.tab ??= {};
    // Tab default
    tabs.tab.default ??= {};
    tabs.tab.default.display ??= "flex";
    tabs.tab.default.justifyContent ??= "center";
    tabs.tab.default.alignItems ??= "center";
    tabs.tab.default.width ??= "fit-content";
    tabs.tab.default.height ??= theme.components.sidebar.right.title.height;
    tabs.tab.default.paddingLeft ??= "0.5rem";
    tabs.tab.default.color ??= theme.colors.default.textSecondary;
    tabs.tab.default.border ??= "1px solid transparent";
    tabs.tab.default.borderRightColor ??= theme.colors.default.border;
    // Adding transition for `translate` property cause flickering after sorting
    tabs.tab.default.transition ??= `all ${theme.default.transition.duration.short} ${theme.default.transition.type}, translate: none`;
    tabs.tab.default.hover ??= {};
    tabs.tab.default.hover.cursor ??= "pointer";
    tabs.tab.default.hover.bg ??= theme.colors.state.hover.bg;
    tabs.tab.default.hover.color ??= theme.colors.default.textPrimary;
    // Tab selected
    tabs.tab.selected ??= {};
    tabs.tab.selected.borderColor ??=
      theme.colors.default.secondary + theme.default.transparency.medium;
    // Tab current
    tabs.tab.current ??= {};
    tabs.tab.current.bg ??= theme.colors.default.bgPrimary;
    tabs.tab.current.color ??= theme.colors.default.textPrimary;
    tabs.tab.current.borderTopColor ??= theme.colors.default.secondary;
    // Tab drag
    tabs.tab.drag ??= {};
    tabs.tab.drag.position ??= "relative";
    tabs.tab.drag.borderColor ??=
      theme.colors.default.secondary + theme.default.transparency.high;
    tabs.tab.drag.after ??= {};
    tabs.tab.drag.after.content ??= '""';
    tabs.tab.drag.after.position ??= "absolute";
    tabs.tab.drag.after.inset ??= 0;
    tabs.tab.drag.after.width ??= "100%";
    tabs.tab.drag.after.height ??= "100%";
    tabs.tab.drag.after.bg ??= tabs.default.bg;
    // Tab drag overlay
    tabs.tab.dragOverlay ??= {};
    tabs.tab.dragOverlay.opacity ??= 0.6;

    return this;
  }

  /** Set default editor component */
  private static _editor() {
    const editor = this._getComponent("editor");
    const theme = this._themeReady;

    editor.default ??= {};
    editor.default.bg ??= theme.colors.default.bgPrimary;
    editor.default.color ??= theme.colors.default.textPrimary;
    editor.default.fontFamily ??= theme.font.code.family;
    editor.default.fontSize ??= theme.font.code.size.large;

    // Editor cursor color
    editor.default.cursorColor ??= theme.colors.default.textSecondary;

    // Editor active line
    editor.default.activeLine ??= {};
    editor.default.activeLine.bg ??= "inherit";
    editor.default.activeLine.borderColor ??= theme.colors.default.border;

    // Editor selection
    editor.default.selection ??= {};
    editor.default.selection.bg ??=
      theme.colors.default.primary + theme.default.transparency.medium;
    editor.default.selection.color ??= "inherit";

    // Editor search match
    editor.default.searchMatch ??= {};
    editor.default.searchMatch.bg ??=
      theme.colors.default.textSecondary + theme.default.transparency.medium;
    editor.default.searchMatch.color ??= "inherit";
    editor.default.searchMatch.selectedBg ??= "inherit";
    editor.default.searchMatch.selectedColor ??= "inherit";

    // Editor gutter
    editor.gutter ??= {};
    editor.gutter.bg ??= editor.default.bg;
    editor.gutter.color ??= theme.colors.default.textSecondary;
    editor.gutter.activeBg ??= "inherit";
    editor.gutter.activeColor ??= theme.colors.default.textPrimary;
    editor.gutter.borderRight ??= "none";

    // Editor inlay hint
    editor.inlayHint ??= {};
    editor.inlayHint.bg ??= "#262730aa";
    editor.inlayHint.color ??= theme.colors.default.textSecondary;
    editor.inlayHint.parameterBg ??= editor.inlayHint.bg;
    editor.inlayHint.parameterColor ??= editor.inlayHint.color;
    editor.inlayHint.typeBg ??= editor.inlayHint.bg;
    editor.inlayHint.typeColor ??= editor.inlayHint.color;

    // Editor minimap
    editor.minimap ??= {};
    editor.minimap.bg ??= editor.default.bg;
    editor.minimap.selectionHighlight ??= theme.colors.default.secondary;

    // Editor peek view
    editor.peekView ??= {};
    editor.peekView.borderColor ??= theme.colors.default.primary;
    // Editor peek view title
    editor.peekView.title ??= {};
    editor.peekView.title.bg ??= theme.colors.default.bgSecondary;
    editor.peekView.title.labelColor ??= theme.colors.default.textPrimary;
    editor.peekView.title.descriptionColor ??=
      theme.colors.default.textSecondary;
    // Editor peek view editor
    editor.peekView.editor ??= {};
    editor.peekView.editor.bg ??= theme.colors.default.bgSecondary;
    editor.peekView.editor.matchHighlightBg ??=
      theme.colors.state.warning.color + theme.default.transparency.medium;
    editor.peekView.editor.gutterBg ??= editor.peekView.editor.bg;
    // Editor peek view result
    editor.peekView.result ??= {};
    editor.peekView.result.bg ??= theme.colors.default.bgPrimary;
    editor.peekView.result.lineColor ??= theme.colors.default.textSecondary;
    editor.peekView.result.fileColor ??= theme.colors.default.textSecondary;
    editor.peekView.result.selectionBg ??=
      theme.colors.default.primary + theme.default.transparency.low;
    editor.peekView.result.selectionColor ??= theme.colors.default.textPrimary;
    editor.peekView.result.matchHighlightBg ??=
      theme.colors.state.warning.color + theme.default.transparency.medium;

    // Editor tooltip/widget
    editor.tooltip ??= {};
    editor.tooltip.bg ??= theme.colors.default.bgSecondary;
    editor.tooltip.color ??= theme.colors.default.textPrimary;
    editor.tooltip.selectedBg ??=
      theme.colors.default.primary + theme.default.transparency.medium;
    editor.tooltip.selectedColor ??= theme.colors.default.textPrimary;
    editor.tooltip.borderColor ??= theme.colors.default.border;

    // Editor wrapper
    editor.wrapper ??= {};

    return this;
  }

  /** Set default home view */
  private static _home() {
    const main = this._getComponent("main");
    const theme = this._themeReady;

    main.primary!.home ??= {};
    const home = main.primary!.home;

    // Default
    home.default ??= {};
    home.default.height ??= "100%";
    home.default.padding ??= "0 8%";

    // Title
    home.title ??= {};
    home.title.color ??= theme.colors.default.textSecondary;
    home.title.padding ??= "2rem";
    home.title.fontWeight ??= "bold";
    home.title.fontSize ??= "2rem";
    home.title.textAlign ??= "center";

    // Resources
    home.resources ??= {};
    // Resources default
    home.resources.default ??= {};
    home.resources.default.maxWidth ??= "53rem";
    // Resources title
    home.resources.title ??= {};
    home.resources.title.marginBottom ??= "1rem";
    home.resources.title.fontWeight ??= "bold";
    home.resources.title.fontSize ??= "1.25rem";
    // Resources card
    home.resources.card ??= {};
    // Resources card default
    home.resources.card.default ??= {};
    home.resources.card.default.bg ??= theme.colors.default.bgPrimary;
    home.resources.card.default.color ??= theme.colors.default.textPrimary;
    home.resources.card.default.border ??= `1px solid ${
      theme.colors.default.border + theme.default.transparency.medium
    }`;
    home.resources.card.default.borderRadius ??= theme.default.borderRadius;
    home.resources.card.default.width ??= "15rem";
    home.resources.card.default.height ??= "15rem";
    home.resources.card.default.padding ??= "1rem 1.5rem 1.5rem 1.5rem";
    home.resources.card.default.marginRight ??= "2rem";
    home.resources.card.default.marginBottom ??= "2rem";
    // Resources card image
    home.resources.card.image ??= {};
    home.resources.card.image.width ??= "1.25rem";
    home.resources.card.image.height ??= "1.25rem";
    home.resources.card.image.marginRight ??= "0.5rem";
    // Resources card title
    home.resources.card.title ??= {};
    home.resources.card.title.display ??= "flex";
    home.resources.card.title.alignItems ??= "center";
    home.resources.card.title.height ??= "20%";
    home.resources.card.title.fontWeight ??= "bold";
    home.resources.card.title.fontSize ??= theme.font.code.size.xlarge;
    // Resources card description
    home.resources.card.description ??= {};
    home.resources.card.description.color ??=
      theme.colors.default.textSecondary;
    home.resources.card.description.height ??= "60%";
    // Resources card button
    home.resources.card.button ??= {};
    home.resources.card.button.width ??= "100%";

    // Tutorials
    home.tutorials ??= {};
    // Tutorials default
    home.tutorials.default ??= {};
    home.tutorials.default.minWidth ??= "16rem";
    home.tutorials.default.maxWidth ??= "27rem";
    // Tutorials title
    home.tutorials.title ??= {};
    home.tutorials.title.marginBottom ??= "1rem";
    home.tutorials.title.fontWeight ??= "bold";
    home.tutorials.title.fontSize ??= "1.25rem";
    // Tutorials card
    home.tutorials.card ??= {};
    home.tutorials.card.bg ??= theme.colors.default.bgPrimary;
    home.tutorials.card.color ??= theme.colors.default.textPrimary;
    home.tutorials.card.border ??= `1px solid
      ${theme.colors.default.border + theme.default.transparency.medium}`;
    home.tutorials.card.borderRadius ??= theme.default.borderRadius;
    home.tutorials.card.padding ??= "1rem";
    home.tutorials.card.marginBottom ??= "1rem";
    home.tutorials.card.transition ??= `all ${theme.default.transition.duration.medium} ${theme.default.transition.type}`;
    home.tutorials.card.display ??= "flex";
    home.tutorials.card.alignItems ??= "center";
    home.tutorials.card.hover ??= {};
    home.tutorials.card.hover.bg ??= theme.colors.state.hover.bg;

    return this;
  }

  /** Set default tutorial view */
  private static _tutorial() {
    const main = this._getComponent("main");
    const theme = this._themeReady;

    main.primary!.tutorial ??= {};
    const tutorial = main.primary!.tutorial;

    // Default
    tutorial.default ??= {};
    tutorial.default.flex ??= 1;
    tutorial.default.overflow ??= "auto";
    tutorial.default.opacity ??= 0;
    tutorial.default.transition ??= `opacity ${theme.default.transition.duration.medium} ${theme.default.transition.type}`;

    // About page
    tutorial.aboutPage ??= {};
    tutorial.aboutPage.bg ??= theme.colors.default.bgPrimary;
    tutorial.aboutPage.borderBottomRightRadius ??= theme.default.borderRadius;
    tutorial.aboutPage.borderTopRightRadius ??= theme.default.borderRadius;
    tutorial.aboutPage.fontFamily ??= theme.font.other.family;
    tutorial.aboutPage.fontSize ??= theme.font.other.size.medium;
    tutorial.aboutPage.padding ??= "2rem";
    tutorial.aboutPage.maxWidth ??= "60rem";

    // Tutorial page
    tutorial.tutorialPage ??= {};
    tutorial.tutorialPage.bg ??= theme.colors.default.bgPrimary;
    tutorial.tutorialPage.fontFamily ??= theme.font.other.family;
    tutorial.tutorialPage.fontSize ??= theme.font.other.size.medium;
    tutorial.tutorialPage.padding ??= "2rem";

    return this;
  }

  /** Set default tutorials view */
  private static _tutorials() {
    const main = this._getComponent("main");
    const theme = this._themeReady;

    main.primary!.tutorials ??= {};
    const tutorials = main.primary!.tutorials;

    // Default
    tutorials.default ??= {};
    tutorials.default.display ??= "flex";
    tutorials.default.flexDirection ??= "column";
    tutorials.default.bg ??= theme.components.main.default.bg;
    tutorials.default.fontFamily ??= theme.font.other.family;
    tutorials.default.fontSize ??= theme.font.other.size.medium;

    // Top
    tutorials.top ??= {};
    tutorials.top.display = "flex";
    tutorials.top.justifyContent = "space-between";
    tutorials.top.padding = "1rem 2.5rem";
    tutorials.top.bg ??= this.getDifferentBackground(tutorials.default.bg);
    tutorials.top.borderBottom ??= `1px solid ${theme.colors.default.border}`;
    tutorials.top["& > div"] ??= {};
    tutorials.top["& > div"].width ??= "max(12rem, 50%)";

    // Main
    tutorials.main ??= {};

    // Main default
    tutorials.main.default ??= {};
    tutorials.main.default.display ??= "flex";
    tutorials.main.default.height ??= "100%";
    tutorials.main.default.bg ??= this.getDifferentBackground(
      theme.components.main.default.bg
    );
    tutorials.main.default.borderRadius ??= theme.default.borderRadius;

    // Main side (filters)
    tutorials.main.side ??= {};
    tutorials.main.side.width ??= "14.5rem";
    tutorials.main.side.flexShrink ??= 0;
    tutorials.main.side.padding ??= "0.5rem";
    tutorials.main.side.borderRight ??= `1px solid ${theme.colors.default.border}`;
    tutorials.main.side.borderTopLeftRadius ??=
      theme.components.main.primary.tutorials.main.default.borderRadius;
    tutorials.main.side.borderBottomLeftRadius ??=
      theme.components.main.primary.tutorials.main.default.borderRadius;

    // Main content (tutorials)
    tutorials.main.content ??= {};

    // Main content default
    tutorials.main.content.default ??= {};
    tutorials.main.content.default.padding ??= "1.5rem";
    tutorials.main.content.default.display ??= "flex";
    tutorials.main.content.default.flexDirection ??= "column";
    tutorials.main.content.default.flexGrow ??= 1;
    tutorials.main.content.default.gap ??= "2rem";
    tutorials.main.content.default.overflow ??= "auto";
    tutorials.main.content.default.bg ??= tutorials.main.default.bg;
    tutorials.main.content.default.borderTopRightRadius ??=
      theme.components.main.primary.tutorials.main.default.borderRadius;
    tutorials.main.content.default.borderBottomRightRadius ??=
      theme.components.main.primary.tutorials.main.default.borderRadius;
    //Main content card
    tutorials.main.content.card ??= {};
    const card = tutorials.main.content.card;
    //Main content card default
    card.default ??= {};
    card.default.width ??= "100%";
    card.default.height ??= "100%";
    card.default.overflow ??= "hidden";
    card.default.bg ??= theme.components.main.primary.tutorials.main.default.bg;
    card.default.color ??= theme.colors.default.textPrimary;
    card.default.border ??= `1px solid ${
      theme.colors.default.border + theme.default.transparency.medium
    }`;
    card.default.borderRadius ??= theme.default.borderRadius;
    card.default.boxShadow ??= theme.default.boxShadow;
    card.default.transition ??= `all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type}`;
    //Main content card gradient
    card.gradient ??= {};
    // Main content featured tutorial
    tutorials.main.content.featured ??= {};
    const featured = tutorials.main.content.featured;
    featured.height ??= "20rem";
    featured.display ??= "flex";
    featured.border ??= `1px solid ${theme.colors.default.border}`;
    featured.borderRadius ??= theme.default.borderRadius;
    featured.boxShadow ??= theme.default.boxShadow;
    featured.overflow ??= "hidden";

    return this;
  }

  /** Set default programs view */
  private static _programs() {
    const main = this._getComponent("main");
    const theme = this._themeReady;

    main.primary!.programs ??= {};
    const programs = main.primary!.programs;

    // Default
    programs.default ??= {};
    programs.default.bg ??= theme.components.main.default.bg;
    programs.default.fontFamily ??= theme.font.other.family;
    programs.default.fontSize ??= theme.font.other.size.medium;

    // Top
    programs.top ??= {};
    programs.top.position ??= "sticky";
    programs.top.top ??= 0;
    programs.top.display ??= "flex";
    programs.top.justifyContent ??= "space-between";
    programs.top.alignItems ??= "center";
    programs.top.width ??= "100%";
    programs.top.height ??= "4.5rem";
    programs.top.padding ??= "1rem 2.5rem";
    programs.top.bg ??= this.getDifferentBackground(programs.default.bg);
    programs.top.borderBottom ??= `1px solid ${theme.colors.default.border}`;
    programs.top["& > div"] ??= {};
    programs.top["& > div"].width ??= "max(12rem, 50%)";

    // Main
    programs.main ??= {};
    // Main default
    programs.main.default ??= {};
    programs.main.default.display ??= "flex";
    programs.main.default.minHeight ??= `calc(100% - ${programs.top.height})`;
    programs.main.default.padding ??= "2rem 2.5rem";
    // Main content
    programs.main.content ??= {};
    // Main content default
    programs.main.content.default ??= {};
    programs.main.content.default.display ??= "flex";
    programs.main.content.default.flexWrap ??= "wrap";
    programs.main.content.default.flexGrow ??= 1;
    programs.main.content.default.gap ??= "1.5rem";
    // Main content card
    programs.main.content.card ??= {};
    programs.main.content.card.flexGrow ??= 1;
    programs.main.content.card.flexBasis ??= "50%";
    programs.main.content.card.display ??= "flex";
    programs.main.content.card.flexDirection ??= "column";
    programs.main.content.card.gap ??= "0.5rem";
    programs.main.content.card.maxWidth ??= "44.95rem";
    programs.main.content.card.height ??= "fit-content";
    programs.main.content.card.padding ??= "1rem";
    programs.main.content.card.border ??= `1px solid ${theme.colors.default.border}`;
    programs.main.content.card.borderRadius ??= theme.default.borderRadius;

    return this;
  }
}
