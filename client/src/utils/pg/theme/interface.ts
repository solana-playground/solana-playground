import { CSSProperties } from "react";

import { ButtonKind } from "../../../components/Button";
import { MenuKind } from "../../../components/Menu";

/**
 * Ready to be used theme. Some of the optional properties will be overridden
 * with default values.
 */
export type PgThemeReady<
  T extends PgTheme = PgTheme,
  P extends keyof T =
    | "components"
    | "font"
    | "borderRadius"
    | "boxShadow"
    | "scrollbar"
    | "transparency"
    | "transition"
> = {
  [K in keyof T]: T[K];
} & {
  [K in P]-?: Required<T[K]>;
};

/** Playground theme */
export interface PgTheme {
  /** Name of the theme that's displayed in theme settings */
  name: string;
  /** Whether the theme is a dark theme */
  isDark: boolean;
  /**
   * Colors of the theme.
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
    left?: BgAndColor; // bgPrimary, textPrimary

    /** Markdown component */
    markdown?: BgAndColor & {
      /** Markdown codeblocks */
      code?: BgAndColor;
    };

    /** Right side of the side panel */
    right?: BgAndColor & { otherBg?: string };

    /** Terminal */
    terminal?: BgAndColor & { cursorColor?: string; selectionBg?: string };

    /** Notification toast */
    toast?: BgAndColor;

    /** Tooltip component */
    tooltip?: BgAndColor & { bgSecondary?: string };

    /** Tutorial component */
    tutorial?: BgAndColor;

    /** Tutorials page */
    tutorials?: BgAndColor & { card?: BgAndColor };
  };

  /** Override the component defaults */
  components?: {
    /** Button component */
    button?: DefaultOverrides<ButtonKind>;

    /** Menu component */
    menu?: DefaultOverrides<MenuKind>;

    /** Input component */
    input?: DefaultComponent;

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

export type DefaultComponent = {
  bg?: CSSProperties["background"];
  color?: CSSProperties["color"];
  border?: CSSProperties["border"];
  borderColor?: CSSProperties["borderColor"];
  borderRadius?: CSSProperties["borderRadius"];
  padding?: CSSProperties["padding"];
  boxShadow?: CSSProperties["boxShadow"];
  outline?: CSSProperties["outline"];
  fontSize?: CSSProperties["fontSize"];
  fontWeight?: CSSProperties["fontWeight"];
  cursor?: CSSProperties["cursor"];
} & DefaultComponentState<
  "hover" | "active" | "focus" | "focusWithin" | "before" | "after"
>;

type DefaultComponentState<T extends string> = {
  [K in T]?: Omit<DefaultComponent, T>;
};

type DefaultOverrides<T extends string> = {
  /** Default CSS values of the Button component */
  default?: DefaultComponent;
  /** Override the defaults with specificity */
  overrides?: {
    [K in T]?: DefaultComponent;
  };
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
