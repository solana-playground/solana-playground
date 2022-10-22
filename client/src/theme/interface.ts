type BgAndColor = {
  bg?: string;
  color?: string;
};

type StateColor = {
  color: string;
  bg?: string;
};

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

type HighlightToken = {
  color?: string;
  fontStyle?: "bold" | "italic";
};

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

export interface PgTheme {
  name: string;
  isDark: boolean;
  colors: {
    // Defaults
    default: {
      primary: string;
      secondary: string;
      bgPrimary: string;
      bgSecondary: string;
      textPrimary: string;
      textSecondary: string;
      borderColor: string;
    };

    state: {
      hover: StateColor;
      disabled: StateColor;
      error: StateColor;
      success: StateColor;
      warning: StateColor;
      info: StateColor;
    };

    // Bottom bar
    bottom?: BgAndColor; // primary, textPrimary

    // Contrast
    contrast?: {
      color: string;
      primary?: boolean;
      secondary?: boolean;
    };

    // Editor
    editor?: BgAndColor & {
      cursorColor?: string; // textSecondary
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

    // Home screen
    home?: BgAndColor & {
      card?: BgAndColor;
    };

    // Left sidebar IconButton
    iconButton?: BgAndColor & {
      selectedBg?: string;
      selectedBorderColor?: string;
    };

    // Input
    input?: BgAndColor & {
      borderColor?: string;
      outlineColor?: string;
    };

    // Icon panel
    left?: BgAndColor; // bgPrimary, textPrimary

    // Markdown component
    markdown?: BgAndColor & {
      code?: BgAndColor;
    };

    // Side right panel
    right?: BgAndColor & { otherBg?: string };

    // Terminal
    terminal?: BgAndColor & { cursorColor?: string; selectionBg?: string };

    // Notification toast
    toast?: BgAndColor;

    // General tooltip
    tooltip?: BgAndColor;

    // Tutorial component
    tutorial?: BgAndColor;

    // Tutorials section
    tutorials?: BgAndColor;
  };

  borderRadius?: string;
  boxShadow?: string;
  font?: Font;
  scrollbar?: Scrollbar;
  skeleton?: Skeleton;
  transparency?: Transparency;
  transition?: Transition;
  highlight: PgHighlight;
}
