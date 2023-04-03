import { CSSProperties } from "react";

import { ButtonKind } from "../../../components/Button";
import { MenuKind } from "../../../components/Menu";
import { ChildRequired, NestedRequired } from "../types";

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

    /** Bottom bar */
    bottom?: BgAndColor;

    /** Editor component */
    editor?: BgAndColor & {
      cursorColor?: string;
      selection?: BgAndColor;
      comment?: BgAndColor;
      searchMatch?: BgAndColor & {
        selectedBg?: string;
        selectedColor?: string;
      };
      activeLine?: BgAndColor & {
        borderColor?: string;
      };
      gutter?: BgAndColor & {
        activeBg?: string;
        activeColor?: string;
      };
      tooltip?: BgAndColor & {
        selectedBg?: string;
        selectedColor?: string;
      };
    };

    /** Home screen */
    home?: BgAndColor & {
      card?: BgAndColor;
    };

    /** Left sidebar IconButton */
    iconButton?: BgAndColor & {
      selectedBg?: string;
      selectedBorderColor?: string;
    };

    /** Left side of the side panel(icon panel) */
    left?: BgAndColor;

    /** Right side of the side panel */
    right?: BgAndColor & { otherBg?: string };

    /** Terminal */
    terminal?: BgAndColor & { cursorColor?: string; selectionBg?: string };

    /** Notification toast */
    toast?: BgAndColor;

    /** Tutorials page */
    tutorials?: BgAndColor & { card?: BgAndColor };
  };

  /** Override the component defaults */
  components?: {
    /** Button component */
    button?: OverrideableComponent<ButtonKind>;

    /** Input component */
    input?: DefaultComponent;

    /** Menu component */
    menu?: OverrideableComponent<MenuKind>;

    /** Markdown component */
    markdown?: ExtendibleComponent<"code">;

    /** Select component */
    select?: {
      control?: DefaultComponent;
      menu?: DefaultComponent;
      option?: DefaultComponent;
      singleValue?: DefaultComponent;
      input?: DefaultComponent;
      groupHeading?: DefaultComponent;
      dropdownIndicator?: DefaultComponent;
      indicatorSeparator?: DefaultComponent;
    };

    /** Skeleton component */
    skeleton?: DefaultComponent & {
      highlightColor?: string;
    };

    /** Tooltip component */
    tooltip?: DefaultStyles & { bgSecondary?: string };

    /** Tutorial component */
    tutorial?: ExtendibleComponent<"aboutPage" | "tutorialPage">;
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
type ExtendibleComponents = "select" | "markdown" | "tutorial";

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
    components: NestedRequired<Pick<C, ExtendibleComponents>>;
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
  bg?: CSSProperties["background"];
} & Pick<
  CSSProperties,
  | "color"
  | "border"
  | "borderColor"
  | "borderRadius"
  | "borderTopRightRadius"
  | "borderBottomRightRadius"
  | "padding"
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
  | "maxWidth"
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

/** Overrideable component */
type OverrideableComponent<T extends string> = {
  /** Default CSS values of the Button component */
  default?: DefaultComponent;
  /** Override the defaults with specificity */
  overrides?: {
    [K in T]?: DefaultComponent;
  };
};

/** Extendible component */
type ExtendibleComponent<T extends string> = {
  default?: DefaultComponent;
} & {
  [K in T]?: DefaultComponent;
};

type Bg = {
  bg?: string;
};

type BgAndColor = Bg & { color?: string };

type StateColor = {
  color: string;
} & Bg;

type HighlightToken = {
  color?: string;
  fontStyle?: "bold" | "italic";
};
