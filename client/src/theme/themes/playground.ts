import { HighlightStyle, tags as t } from "@codemirror/highlight";

import Theme from "../interface";

// BG
const BG_DEFAULT = "#151721",
  BG_DARK = "#0e1019",
  BG_LIGHT = "#212431",
  // FG
  BLUE = "#5288f2",
  DARK_BLUE = "#1a2c4f",
  CYAN = "#46c9d7",
  RED = "#bd3653",
  GREEN = "#42b760",
  YELLOW = "#ae9f38",
  // TEXT
  TEXT_PRIMARY = "#f2f2f7",
  TEXT_SECONDARY = "#c0c1ce",
  // Border
  BORDER_COLOR = "#293244",
  // State
  DISABLED = "#0c0c11",
  COMMENT = "#9BA8C8";

// Highlighting
const H_YELLOW = "#fff296",
  H_LIGHT_BLUE = "#38ccff",
  H_PURPLE = "#d57bee",
  H_PINK = "#e1a6da",
  H_GREEN = "#32e17f";

// Code highlighting
// Highligts the part between '_'
const highlight = HighlightStyle.define([
  {
    // const x: _bool_ = true;
    tag: t.typeName,
    color: CYAN,
    fontStyle: "italic",
  },
  {
    // _String_::new();
    tag: t.namespace,
    color: CYAN,
  },
  {
    // _println!_()
    tag: t.macroName,
    color: H_GREEN,
  },
  {
    // _myFunction_()
    tag: t.function(t.variableName),
    color: H_GREEN,
  },
  {
    // a._to_lowercase_()
    tag: t.function(t.propertyName),
    color: H_GREEN,
  },
  {
    // const macro_rules struct union enum type fn impl trait let static
    tag: t.definitionKeyword,
    color: BLUE,
  },
  {
    // mod use crate
    tag: t.moduleKeyword,
    color: BLUE,
  },
  {
    // pub unsafe async mut extern default move
    tag: t.modifier,
    color: BLUE,
  },
  {
    // for if else loop while match continue break return await
    tag: t.controlKeyword,
    color: H_PURPLE,
  },
  {
    // as in ref
    tag: t.operatorKeyword,
    color: H_PURPLE,
  },
  {
    // where _ crate super dyn
    tag: t.keyword,
    color: BLUE,
  },
  {
    // self
    tag: t.self,
    color: BLUE,
  },
  {
    // true
    tag: t.bool,
    color: BLUE,
    fontWeight: "bold",
  },
  {
    // 5
    tag: t.integer,
    color: H_PINK,
  },
  {
    // 5.5
    tag: t.literal,
    color: H_PINK,
  },
  {
    // "" + b"" + r#""#
    tag: t.string,
    color: H_YELLOW,
  },
  {
    tag: t.character,
    color: H_YELLOW,
  },
  {
    // &, =
    tag: t.operator,
    color: H_PURPLE,
  },
  {
    // *
    tag: t.derefOperator,
    color: H_PURPLE,
  },
  {
    // Lifetime &_'a_
    tag: t.special(t.variableName),
    color: H_PURPLE,
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
  {
    // #
    tag: t.meta,
    color: H_LIGHT_BLUE,
  },
  {
    tag: t.invalid,
    color: RED,
  },
]);

export const PLAYGROUND: Theme = {
  name: "Playground",
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_DEFAULT,
      bgSecondary: BG_DARK,
      borderColor: BORDER_COLOR,
      primary: BLUE,
      secondary: CYAN,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
    },
    state: {
      disabled: {
        bg: DISABLED,
        color: TEXT_SECONDARY,
      },
      error: {
        color: RED,
      },
      hover: {
        bg: BG_LIGHT,
      },
      info: {
        color: BLUE,
      },
      success: {
        color: GREEN,
      },
      warning: {
        color: YELLOW,
      },
    },
    bottom: {
      bg: DARK_BLUE,
    },
    iconButton: {
      selectedBg: BG_LIGHT,
    },
    home: {
      bg: BG_DARK,
      card: {
        bg: BG_DEFAULT,
      },
    },
    editor: {
      gutter: {
        color: COMMENT,
      },
    },
  },
  skeleton: {
    color: BG_LIGHT,
    highlightColor: BG_DEFAULT,
  },
  highlight,
};
