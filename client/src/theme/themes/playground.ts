import { PgTheme } from "../../utils/pg/theme";

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

const PLAYGROUND: PgTheme = {
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_DEFAULT,
      bgSecondary: BG_DARK,
      primary: BLUE,
      secondary: CYAN,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
      border: BORDER_COLOR,
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
        color: "#838799",
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
  },
  components: {
    bottom: {
      default: {
        bg: DARK_BLUE,
      },
    },
    editor: {
      gutter: {
        color: COMMENT,
      },
    },
    skeleton: {
      bg: BG_LIGHT,
      highlightColor: BG_DEFAULT,
    },
  },
  highlight: {
    typeName: { color: CYAN, fontStyle: "italic" },
    variableName: { color: TEXT_PRIMARY },
    namespace: { color: CYAN },
    macroName: { color: H_GREEN },
    functionCall: { color: H_GREEN },
    functionDef: { color: H_GREEN },
    functionArg: { color: YELLOW },
    definitionKeyword: { color: BLUE },
    moduleKeyword: { color: BLUE },
    modifier: { color: BLUE },
    controlKeyword: { color: H_PURPLE },
    operatorKeyword: { color: H_PURPLE },
    keyword: { color: BLUE },
    self: { color: BLUE },
    bool: { color: BLUE, fontStyle: "bold" },
    integer: { color: H_PINK },
    literal: { color: H_PINK },
    string: { color: H_YELLOW },
    character: { color: H_YELLOW },
    operator: { color: H_PURPLE },
    derefOperator: { color: H_PURPLE },
    specialVariable: { color: H_PURPLE },
    lineComment: { color: COMMENT },
    blockComment: { color: COMMENT },
    meta: { color: H_LIGHT_BLUE },
    invalid: { color: RED },
    constant: { color: BLUE },
    regexp: { color: YELLOW },
    tagName: { color: YELLOW },
    attributeName: { color: YELLOW },
    attributeValue: { color: YELLOW },
    annotion: { color: YELLOW },
  },
};

export default PLAYGROUND;
