import { CSSProperties } from "react";
import { ITerminalOptions as XtermOptions } from "xterm";

import { ButtonKind } from "../../../components/Button";
import { MenuKind } from "../../../components/Menu";
import { ChildRequired, NestedRequired, RequiredUntil } from "../types";

/** Playground theme */
export interface PgTheme {
  /** Whether the theme is a dark theme */
  isDark: boolean;

  /**
   * Colors of the theme.
   *
   * NOTE: Optional theme properties will be derived from the following colors
   * if they are not specified during creation.
   */
  colors: {
    /** Default colors */
    default: {
      primary: string;
      secondary: string;
      bgPrimary: string;
      bgSecondary: string;
      textPrimary: string;
      textSecondary: string;
      borderColor: string;
    };

    /** State colors */
    state: {
      hover: StateColor;
      disabled: StateColor;
      error: StateColor;
      success: StateColor;
      warning: StateColor;
      info: StateColor;
    };
  };

  /** Override the component defaults */
  components?: {
    /** Bottom bar component */
    bottom?: ExtendibleComponent<
      "connect" | "endpoint" | "address" | "balance"
    >;

    /** Button component */
    button?: OverrideableComponent<ButtonKind>;

    /** Editor component */
    editor?: {
      /** Editor defaults */
      default?: BgAndColor & {
        cursorColor?: Color;
        activeLine?: BgAndColor & Pick<CSSProperties, "borderColor">;
        selection?: BgAndColor;
        searchMatch?: BgAndColor & {
          selectedBg?: Bg;
          selectedColor?: Color;
        };
      };
      /** Gutter component */
      gutter?: BgAndColor & {
        activeBg?: Bg;
        activeColor?: Color;
      } & Pick<CSSProperties, "borderRight">;
      /** Minimap component */
      minimap?: {
        bg?: Bg;
        selectionHighlight?: Color;
      };
      /** Peek view component */
      peekView?: {
        title?: {
          bg?: Bg;
          labelColor?: Color;
          descriptionColor?: Color;
        };
        editor?: {
          bg?: Bg;
          matchHighlightBg?: Bg;
          gutterBg?: Bg;
        };
        result?: {
          bg?: Bg;
          lineColor?: Color;
          fileColor?: Color;
          selectionBg?: Bg;
          selectionColor?: Color;
          matchHighlightBg?: Bg;
        };
      } & Pick<CSSProperties, "borderColor">;
      /** Tooltip or widget component */
      tooltip?: BgAndColor & {
        selectedBg?: Bg;
        selectedColor?: Color;
      } & Pick<CSSProperties, "borderColor">;
    };

    /** Home component */
    home?: ExtendibleComponent<{
      /** Playground title */
      title?: DefaultComponent;
      /** Resources section */
      resources?: ExtendibleComponent<{
        /** Resources title */
        title?: DefaultComponent;
        /** Resource card */
        card?: ExtendibleComponent<
          "image" | "title" | "description" | "button"
        >;
      }>;
      /** Tutorials section */
      tutorials?: ExtendibleComponent<"title" | "card">;
    }>;

    /** Input component */
    input?: DefaultComponent;

    /** Menu component */
    menu?: OverrideableComponent<MenuKind>;

    /** Markdown component */
    markdown?: ExtendibleComponent<"code">;

    /** Select component */
    select?: ExtendibleComponent<
      | "control"
      | "menu"
      | "option"
      | "singleValue"
      | "input"
      | "groupHeading"
      | "dropdownIndicator"
      | "indicatorSeparator"
    >;

    /** Sidebar component */
    sidebar?: ExtendibleComponent<{
      /** Left side of the side panel(icon panel) */
      left?: ExtendibleComponent<{
        /** Left sidebar IconButton */
        iconButton?: ExtendibleComponent<"selected">;
      }>;

      /** Right side of the side panel */
      right?: ExtendibleComponent<"title", { otherBg?: Bg }>;
    }>;

    /** Skeleton component */
    skeleton?: DefaultComponent & {
      highlightColor?: Color;
    };

    /** Terminal component */
    terminal?: ExtendibleComponent<{
      xterm?: {
        [K in
          | "textPrimary"
          | "textSecondary"
          | "primary"
          | "secondary"
          | "success"
          | "error"
          | "warning"
          | "info"]?: Color;
      } & {
        selectionBg?: Bg;
        cursor?: {
          color?: Color;
          accentColor?: Color;
          blink?: XtermOptions["cursorBlink"];
          kind?: XtermOptions["cursorStyle"];
        };
      };
    }>;

    /** Notification toast component */
    toast?: ExtendibleComponent<"progress" | "closeButton">;

    /** Tooltip component */
    tooltip?: DefaultStyles & { bgSecondary?: Bg };

    /** Tutorial component */
    tutorial?: ExtendibleComponent<"aboutPage" | "tutorialPage">;

    /** Tutorials page component */
    tutorials?: ExtendibleComponent<{
      /** Tutorial card component */
      card?: ExtendibleComponent<{
        /** Wrapper gradient */
        gradient?: DefaultComponent;
        /** Wrapper bottom section of the card */
        info?: ExtendibleComponent<"name" | "description" | "category">;
      }>;
    }>;
  };

  /** Default border radius */
  borderRadius?: string;

  /** Default box shadow */
  boxShadow?: string;

  /** Default font */
  font?: {
    /** Code font */
    code?: PgFont;
    /** Any font other than code(e.g Markdown) */
    other?: PgFont;
  };

  /** Scrollbar default */
  scrollbar?: Scrollbar;

  /** Default transparency values as hex string(00-ff) */
  transparency?: Transparency;

  /** Default transition values */
  transition?: Transition;

  /** Code highlight styles */
  highlight: PgHighlight;
}

/** Importable(lazy) theme */
export interface ImportableTheme {
  /** Name of the theme that's displayed in theme settings */
  name: string;
  /** Import promise for the theme to lazy load */
  importTheme: () => Promise<{
    default: PgTheme;
  }>;
}

/** Components that use `DefaultComponent` type */
type DefaultComponents = "input" | "skeleton" | "tooltip";

/** Components that use `ExtendibleComponent` type */
type ExtendibleComponents =
  | "bottom"
  | "editor"
  | "home"
  | "markdown"
  | "select"
  | "sidebar"
  | "terminal"
  | "toast"
  | "tutorial"
  | "tutorials";

/** Components that use `OverrideableComponent` type */
type OverrideableComponents = "button" | "menu";

/**
 * Ready to be used theme. Some of the optional properties will be overridden
 * with default values.
 */
export type PgThemeReady<
  T extends PgTheme = PgTheme,
  C extends NonNullable<T["components"]> = NonNullable<T["components"]>
> = Pick<ImportableTheme, "name"> &
  NestedRequired<T> & {
    // Default components
    components: Pick<C, DefaultComponents>;
  } & {
    // Extendible components
    components: RequiredUntil<Pick<C, ExtendibleComponents>, DefaultComponent>;
  } & {
    // Overrideable components
    components: ChildRequired<
      Pick<C, OverrideableComponents>,
      OverrideableComponents,
      "default"
    >;
  };

/** Syntax highlighting styles */
export interface PgHighlight {
  // const x: _bool_ = true;
  typeName: HighlightToken;

  // let _x_: bool = true;
  variableName: HighlightToken;

  // _String_::new();
  namespace: HighlightToken;

  // _println!_()
  macroName: HighlightToken;

  // _myFn_()
  functionCall: HighlightToken;

  // a._to_lowercase_()
  functionDef: HighlightToken;

  // myFn(_arg_: bool)
  functionArg: HighlightToken;

  // const macro_rules struct union enum type fn impl trait let static
  definitionKeyword: HighlightToken;

  // mod use crate
  moduleKeyword: HighlightToken;

  // pub unsafe async mut extern default move
  modifier: HighlightToken;

  // for if else loop while match continue break return await
  controlKeyword: HighlightToken;

  // as in ref
  operatorKeyword: HighlightToken;

  // where crate super dyn
  keyword: HighlightToken;

  // self
  self: HighlightToken;

  // true
  bool: HighlightToken;

  // 5
  integer: HighlightToken;

  // 5.5
  literal: HighlightToken;

  // "" + b"" + r#""#
  string: HighlightToken;

  // '
  character: HighlightToken;

  // &
  operator: HighlightToken;

  // *
  derefOperator: HighlightToken;

  // Lifetime &_'a_
  specialVariable: HighlightToken;

  // Comment with //
  lineComment: HighlightToken;

  // Comment with /* */
  blockComment: HighlightToken;

  // #
  meta: HighlightToken;

  invalid: HighlightToken;

  /// Unused in Rust

  // const _x_: bool = true;
  constant: HighlightToken;

  regexp: HighlightToken;

  tagName: HighlightToken;

  attributeName: HighlightToken;

  attributeValue: HighlightToken;

  annotion: HighlightToken;
}

/** Playground font */
export type PgFont = {
  family: string;
  size: {
    xsmall: string;
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
};

export type Scrollbar = {
  thumb: {
    color: string;
    hoverColor: string;
  };
  width?: {
    editor: string;
  };
};

export type Transition = {
  type: string;
  duration: {
    short: string;
    medium: string;
    long: string;
  };
};

export type Transparency = {
  low: string;
  medium: string;
  high: string;
};

/** Properties that are allowed to be specified from theme objects */
type DefaultStyles = {
  bg?: Bg;
} & Pick<
  CSSProperties,
  | "color"
  | "border"
  | "borderTop"
  | "borderRight"
  | "borderBottom"
  | "borderLeft"
  | "borderColor"
  | "borderRadius"
  | "borderTopRightRadius"
  | "borderBottomRightRadius"
  | "padding"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "boxShadow"
  | "outline"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "cursor"
  | "flex"
  | "overflow"
  | "opacity"
  | "transition"
  | "minWidth"
  | "maxWidth"
  | "minHeight"
  | "width"
  | "height"
  | "display"
  | "alignItems"
  | "textAlign"
>;

/** CSS pseudo classes */
type PseudoClass =
  | "hover"
  | "active"
  | "focus"
  | "focusWithin"
  | "before"
  | "after";

/** Default component without pseudo classes */
type DefaultComponentState<T extends PseudoClass = PseudoClass> = {
  [K in T]?: Omit<DefaultComponent, T>;
};

/** Default component with pseudo classes */
export type DefaultComponent = DefaultStyles & DefaultComponentState;

/** Extendible component */
type ExtendibleComponent<
  T extends string | object,
  D = {},
  U = T extends string
    ? {
        [K in T]?: DefaultComponent;
      }
    : T
> = {
  default?: DefaultComponent & D;
} & (T extends string
  ? { [K in U extends any ? keyof U : never]?: DefaultComponent }
  : U);

/** Overrideable component */
type OverrideableComponent<T extends string> = {
  /** Default CSS values of the Button component */
  default?: DefaultComponent;
  /** Override the defaults with specificity */
  overrides?: {
    [K in T]?: DefaultComponent;
  };
};

/** CSS background */
type Bg = string;

/** CSS color */
type Color = NonNullable<CSSProperties["color"]>;

/** Optional background and color */
type BgAndColor = { bg?: Bg } & { color?: Color };

/** Required color, optional background */
type StateColor = {
  color: Color;
} & {
  bg?: Bg;
};

/** Syntax highlighting token */
type HighlightToken = Pick<CSSProperties, "color" | "fontStyle">;
