import { HighlightStyle, tags as t } from "@codemirror/highlight";

import Theme from "../interface";

// BG
const BG_DEFAULT = "#282A36",
  BG_DARK = "#21222C",
  BG_DARKER = "#191A21",
  // FG
  CYAN = "#8BE9FD",
  GREEN = "#50FA7B",
  // ORANGE = "#FFB86C",
  PINK = "#FF79C6",
  PURPLE = "#BD93F9",
  RED = "#FF5555",
  YELLOW = "#F1FA8C",
  // TEXT
  TEXT_PRIMARY = "#F8F8F2",
  TEXT_SECONDARY = "#BCC2CD",
  // State
  COMMENT = "#6272A4",
  SELECTION = "#44475A",
  HOVER = "#343746";

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
    color: GREEN,
  },
  {
    // _myFunction_()
    tag: t.function(t.variableName),
    color: GREEN,
  },
  {
    // a._to_lowercase_()
    tag: t.function(t.propertyName),
    color: GREEN,
  },
  {
    // const macro_rules struct union enum type fn impl trait let static
    tag: t.definitionKeyword,
    color: PINK,
  },
  {
    // mod use crate
    tag: t.moduleKeyword,
    color: PINK,
  },
  {
    // pub unsafe async mut extern default move
    tag: t.modifier,
    color: PINK,
  },
  {
    // for if else loop while match continue break return await
    tag: t.controlKeyword,
    color: PINK,
  },
  {
    // as in ref
    tag: t.operatorKeyword,
    color: PINK,
  },
  {
    tag:
      // where _ crate super dyn
      t.keyword,
    color: PINK,
  },
  {
    // self
    tag: t.self,
    color: PINK,
  },
  {
    // true
    tag: t.bool,
    color: PURPLE,
  },
  {
    // 5
    tag: t.integer,
    color: PURPLE,
  },
  {
    // 5.5
    tag: t.literal,
    color: PURPLE,
  },
  {
    // "" + b"" + r#""#
    tag: t.string,
    color: YELLOW,
  },
  {
    tag: t.character,
    color: YELLOW,
  },
  {
    // &
    tag: t.operator,
    color: PINK,
  },
  {
    // *
    tag: t.derefOperator,
    color: PINK,
  },
  {
    // Lifetime &_'a_
    tag: t.special(t.variableName),
    color: PURPLE,
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
    color: PURPLE,
  },
  {
    tag: t.invalid,
    color: RED,
  },
]);

export const DRACULA: Theme = {
  name: "Dracula",
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_DEFAULT,
      bgSecondary: BG_DARK,
      primary: PURPLE,
      secondary: PINK,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
      borderColor: SELECTION,
    },
    state: {
      hover: {
        bg: HOVER,
      },
      disabled: {
        bg: BG_DARKER,
        color: TEXT_SECONDARY,
      },
      error: {
        color: RED,
      },
      success: {
        color: GREEN,
      },
      warning: {
        color: YELLOW,
      },
      info: {
        color: CYAN,
      },
    },
    editor: {
      comment: {
        color: COMMENT,
      },
      activeLine: {
        borderColor: SELECTION,
      },
      gutter: {
        color: COMMENT,
      },
    },
    bottom: {
      bg: BG_DARKER,
    },
    iconButton: {
      selectedBg: SELECTION,
    },
    toast: {
      bg: BG_DARKER,
      color: TEXT_PRIMARY,
    },
    tooltip: {
      bg: BG_DARKER,
      color: TEXT_PRIMARY,
    },
  },
  skeleton: {
    color: SELECTION,
    highlightColor: HOVER,
  },
  highlight,
};
