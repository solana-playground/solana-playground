import { HighlightStyle, tags as t } from "@codemirror/highlight";

import Theme from "../interface";

// BG
const BG_BLACK = "#000000",
  // BG_WHITE = "#F9F9FB",
  BG_GRAY = "#18191E",
  // FG
  GREEN = "#14F195",
  PURPLE = "#9945FF",
  BLUE = "#80ECFF",
  PINK = "#EB54BC",
  // ORANGE = "#F85228",
  RED = "#DC3545",
  YELLOW = "#FFC107",
  // TEXT
  TEXT_PRIMARY = "#FFFFFF",
  TEXT_SECONDARY = "#AAAAAA",
  // State
  DISABLED = "#111114",
  HOVER_BG = "#2B2D39",
  SELECTION = "#232323";

// Code highlighting
// Highligts the part between '_'
const highlight = HighlightStyle.define([
  {
    // const x: _bool_ = true;
    tag: t.typeName,
    color: BLUE,
    fontStyle: "italic",
  },
  {
    // _String_::new();
    tag: t.namespace,
    color: BLUE,
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
    color: TEXT_SECONDARY,
  },
  {
    // Comment with /* */
    tag: t.blockComment,
    color: TEXT_SECONDARY,
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

export const SOLANA: Theme = {
  name: "Solana",
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_BLACK,
      bgSecondary: BG_GRAY,
      borderColor: SELECTION,
      primary: GREEN,
      secondary: PURPLE,
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
        bg: HOVER_BG,
      },
      info: {
        color: BLUE,
      },
      success: {
        color: GREEN,
      },
      warning: { color: YELLOW },
    },
    contrast: {
      color: BG_BLACK,
      primary: true,
    },
    bottom: {
      color: BG_BLACK,
    },
    editor: {
      bg: BG_GRAY,
      tooltip: {
        bg: BG_BLACK,
      },
      activeLine: {
        borderColor: SELECTION,
      },
      gutter: {
        color: TEXT_SECONDARY,
        activeColor: TEXT_PRIMARY,
      },
    },
    home: {
      bg: BG_BLACK,
      card: {
        bg: BG_GRAY,
      },
    },
    right: {
      bg: BG_BLACK,
      otherBg: BG_GRAY,
    },
    terminal: {
      bg: BG_GRAY,
    },
    tooltip: {
      bg: BG_GRAY,
      color: TEXT_PRIMARY,
    },
    toast: {
      bg: BG_GRAY,
      color: TEXT_PRIMARY,
    },
  },
  skeleton: {
    color: SELECTION,
    highlightColor: HOVER_BG,
  },
  highlight,
};
