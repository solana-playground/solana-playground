import type { Theme } from "../../utils/pg";

// BG
const BG_DEFAULT = "#282A36",
  BG_DARK = "#21222C",
  BG_DARKER = "#191A21",
  // FG
  CYAN = "#8BE9FD",
  GREEN = "#50FA7B",
  ORANGE = "#FFB86C",
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

const DRACULA: Theme = {
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_DEFAULT,
      bgSecondary: BG_DARK,
      primary: PURPLE,
      secondary: PINK,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
      border: SELECTION,
    },
    state: {
      hover: {
        bg: HOVER,
        color: "#888a9d",
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
  },
  components: {
    bottom: {
      default: {
        bg: BG_DARKER,
      },
      connect: {
        hover: {
          bg: PURPLE + "16",
        },
      },
    },
    editor: {
      gutter: {
        color: COMMENT,
      },
    },
    modal: {
      default: {
        bg: BG_DARK,
      },
    },
    sidebar: {
      left: {
        button: {
          selected: {
            bg: SELECTION,
          },
        },
      },
    },
    skeleton: {
      bg: SELECTION,
      highlightColor: HOVER,
    },
    toast: {
      default: {
        bg: BG_DARKER,
      },
    },
    tooltip: {
      bg: BG_DARKER,
    },
  },
  highlight: {
    typeName: { color: CYAN, fontStyle: "italic" },
    variableName: { color: TEXT_PRIMARY },
    namespace: { color: CYAN },
    macroName: { color: GREEN },
    functionCall: { color: GREEN },
    functionDef: { color: GREEN },
    functionArg: { color: ORANGE },
    definitionKeyword: { color: PINK },
    moduleKeyword: { color: PINK },
    modifier: { color: PINK },
    controlKeyword: { color: PINK },
    operatorKeyword: { color: PINK },
    keyword: { color: PINK },
    self: { color: PINK },
    bool: { color: PURPLE },
    integer: { color: PURPLE },
    literal: { color: PURPLE },
    string: { color: YELLOW },
    character: { color: YELLOW },
    operator: { color: PINK },
    derefOperator: { color: PINK },
    specialVariable: { color: PURPLE },
    lineComment: { color: COMMENT },
    blockComment: { color: COMMENT },
    meta: { color: PURPLE },
    invalid: { color: RED },
    constant: { color: TEXT_PRIMARY },
    regexp: { color: ORANGE },
    tagName: { color: YELLOW },
    attributeName: { color: YELLOW },
    attributeValue: { color: YELLOW },
    annotion: { color: ORANGE },
  },
};

export default DRACULA;
