import { ButtonKind } from "../components/Button";

export interface PgTheme {
  name: string;
  isDark: boolean;
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

    /** Button component */
    button?: {
      color?: string;
      hoverColor?: string;
      overrides?: {
        [K in ButtonKind]?: {
          color?: string;
          bgColor?: string;
          borderColor?: string;
          hoverColor?: string;
          hoverBgColor?: string;
          hoverBorderColor?: string;
          padding?: string;
        };
      };
    };

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

    /** Input component */
    input?: BgAndColor & {
      borderColor?: string;
      outlineColor?: string;
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

    /** Tutorials page*/
    tutorials?: BgAndColor & { card?: BgAndColor };
  };

  /** Default border radius */
  borderRadius?: string;

  /** Default box shadow */
  boxShadow?: string;

  /** Default font */
  font?: {
    /** Code font */
    code?: Font;
    /** Any font other than code(e.g Markdown) */
    other?: Font;
  };

  /** Scrollbar default */
  scrollbar?: Scrollbar;

  /** Skeleton component */
  skeleton?: Skeleton;

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

export type Font = {
  family: string;
  size: {
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

export type Skeleton = {
  color: string;
  highlightColor: string;
};

type BgAndColor = {
  bg?: string;
  color?: string;
};

type StateColor = {
  color: string;
  bg?: string;
};

type HighlightToken = {
  color?: string;
  fontStyle?: "bold" | "italic";
};
