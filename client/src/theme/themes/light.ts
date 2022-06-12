import { HighlightStyle, tags as t } from "@codemirror/highlight";

import Theme from "../interface";

// BG
const BG_DARK = "#2c2c2c";
const BG_LIGHT = "#f3f3f3";
const BG_WHITE = "#ffffff";

// FG
const BLUE = "#2979cc";
const PURPLE = "#af22db";
const GUTTER_BLUE = "#257893";
const TYPE_BLUE = "#41b3e8";
const FN_YELLOW = "#e19f41";
const KEYWORDS_BLUE = "#285fff";
const CONDITIONAL_PURPLE = "#b14ff1";
const NUMBER_GREEN = "#298c67";
const STRING_RED = "#b41c32";
const AMPERSAND_DARK_BLUE = "#020737";
const ERROR_RED = "#ff5555";

//TEXT
const TEXT_PRIMARY = "#333333";
const TEXT_SECONDARY = "#555555";

const BORDER_COLOR = "#eeeeee";

// State
const COMMENT = "#238000";
const SELECTION = "#e5ebf1";
const HOVER = "#00000010";
const DISABLED = "#cccccc";

const highlight = HighlightStyle.define([
  {
    // const x: _bool_ = true;
    tag: t.typeName,
    color: TYPE_BLUE,
    fontStyle: "italic",
  },
  {
    // _String_::new();
    tag: t.namespace,
    color: TYPE_BLUE,
  },
  {
    // _println!_()
    tag: t.macroName,
    color: KEYWORDS_BLUE,
  },
  {
    // _myFunction_()
    tag: t.function(t.variableName),
    color: FN_YELLOW,
  },
  {
    // a._to_lowercase_()
    tag: t.function(t.propertyName),
    color: FN_YELLOW,
  },
  {
    // const macro_rules struct union enum type fn impl trait let static
    tag: t.definitionKeyword,
    color: KEYWORDS_BLUE,
  },
  {
    // mod use crate
    tag: t.moduleKeyword,
    color: KEYWORDS_BLUE,
  },
  {
    // pub unsafe async mut extern default move
    tag: t.modifier,
    color: KEYWORDS_BLUE,
  },
  {
    // for if else loop while match continue break return await
    tag: t.controlKeyword,
    color: CONDITIONAL_PURPLE,
  },
  {
    // as in ref
    tag: t.operatorKeyword,
    color: KEYWORDS_BLUE,
  },
  {
    tag:
      // where _ crate super dyn
      t.keyword,
    color: KEYWORDS_BLUE,
  },
  {
    // self
    tag: t.self,
    color: KEYWORDS_BLUE,
  },
  {
    // true
    tag: t.bool,
    color: KEYWORDS_BLUE,
  },
  {
    // 5
    tag: t.integer,
    color: NUMBER_GREEN,
  },
  {
    // 5.5
    tag: t.literal,
    color: NUMBER_GREEN,
  },
  {
    // "" + b"" + r#""#
    tag: t.string,
    color: STRING_RED,
  },
  {
    tag: t.character,
    color: STRING_RED,
  },
  {
    // &
    tag: t.operator,
    color: AMPERSAND_DARK_BLUE,
  },
  {
    tag: t.derefOperator,
    color: AMPERSAND_DARK_BLUE,
  },
  {
    // Lifetime &_'a_
    tag: t.special(t.variableName),
    color: AMPERSAND_DARK_BLUE,
  },
  {
    // Comment with //
    tag: t.lineComment,
    color: COMMENT,
  },
  {
    // Comment with /* */
    tag: t.blockComment,
    color: COMMENT,
  },
]);

export const LIGHT: Theme = {
  name: "Light",
  isDark: false,
  colors: {
    default: {
      bgPrimary: BG_WHITE,
      bgSecondary: BG_LIGHT,
      primary: BLUE,
      secondary: PURPLE,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
      borderColor: SELECTION,
    },
    state: {
      hover: {
        bg: HOVER,
      },
      disabled: {
        bg: DISABLED,
        color: TEXT_SECONDARY,
      },
      error: {
        color: ERROR_RED,
      },
      success: {
        color: NUMBER_GREEN,
      },
      warning: {
        color: FN_YELLOW,
      },
      info: {
        color: BLUE,
      },
    },
    left: {
      bg: BG_DARK,
    },
    right: {
      bg: BG_LIGHT,
    },
    editor: {
      bg: BG_WHITE,
      color: "#0f1780",
      selection: {
        bg: SELECTION,
      },
      comment: {
        bg: COMMENT,
      },
      gutter: {
        color: GUTTER_BLUE,
        activeColor: TEXT_PRIMARY,
      },
      activeLine: {
        borderColor: BORDER_COLOR,
      },
    },
    iconButton: {
      selectedBg: HOVER,
      selectedBorderColor: BG_LIGHT,
    },
    contrast: {
      color: BG_WHITE,
      primary: true,
      secondary: true,
    },
    bottom: {
      color: BG_WHITE,
    },
    home: {
      bg: BG_LIGHT,
      card: {
        bg: BG_WHITE,
      },
    },
  },
  skeleton: {
    color: "#e5e4e6",
    highlightColor: BG_LIGHT,
  },
  highlight,
};
