import type { Theme } from "../../utils/pg";

// BG
const BG_DEFAULT = "#151721",
  BG_DARK = "#0e1019",
  BG_LIGHT = "#212431",
  // FG
  BLUE = "#5288f2",
  DARK_BLUE = "#1a2c4f",
  CYAN = "#46c9d7",
  RED = "#c63453",
  GREEN = "#29cd7d",
  YELLOW = "#e7d354",
  // TEXT
  TEXT_PRIMARY = "#f2f2f7",
  TEXT_SECONDARY = "#c0c1ce",
  // Border
  BORDER_COLOR = "#293244",
  // State
  DISABLED = "#0c0c11",
  COMMENT = "#9BA8C8";

// Highlighting
const H_YELLOW = "#ffd174",
  H_LIGHT_BLUE = "#38ccff",
  H_PURPLE = "#d57bee",
  H_PINK = "#e1a6da",
  H_GREEN = "#2ef0b1";

const BOX_SHADOW_LIGHT = `0px 0px 12px 0px ${TEXT_PRIMARY}30`;

const PROGRESS_BG = `linear-gradient(to right, ${BLUE}, ${CYAN})`;

const PLAYGROUND: Theme = {
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
  default: {
    backdrop: {
      backdropFilter: "blur(8px)",
    },
    borderRadius: "8px",
    boxShadow: "#0d081680 -1px 4px 8px",
  },
  components: {
    bottom: {
      default: {
        bg: DARK_BLUE,
      },
    },
    button: {
      default: {
        borderRadius: "12px",
      },
    },
    editor: {
      default: {
        bg: "transparent",
      },
      gutter: {
        bg: "transparent",
        color: COMMENT,
      },
      wrapper: {
        bg: `linear-gradient(315deg, ${BG_DEFAULT}, ${BG_LIGHT})`,
      },
    },
    main: {
      default: {
        bg: `linear-gradient(45deg, ${BG_DARK}, ${BG_DEFAULT})`,
      },
      primary: {
        home: {
          resources: {
            card: {
              default: {
                boxShadow: BOX_SHADOW_LIGHT,
                border: "none",
              },
            },
          },
        },
        programs: {
          top: {
            bg: `linear-gradient(180deg, ${BG_DEFAULT}, ${BG_LIGHT})`,
            boxShadow: BOX_SHADOW_LIGHT,
          },
        },
        tutorial: {
          aboutPage: {
            bg: "transparent",
            boxShadow: BOX_SHADOW_LIGHT,
          },
        },
        tutorials: {
          top: {
            bg: `linear-gradient(180deg, ${BG_DEFAULT}, ${BG_LIGHT})`,
            boxShadow: BOX_SHADOW_LIGHT,
          },
          main: {
            content: {
              card: {
                default: {
                  boxShadow: BOX_SHADOW_LIGHT,
                },
              },
              featured: {
                boxShadow: BOX_SHADOW_LIGHT,
              },
            },
          },
        },
      },
      secondary: {
        default: {
          bg: `linear-gradient(210deg, ${BG_DEFAULT} 75%, ${BG_LIGHT})`,
          borderTop: `1px solid ${BLUE}80`,
          transition: `all 250ms ease-in-out`,
          focusWithin: {
            borderTopColor: BLUE,
          },
        },
      },
    },
    modal: {
      default: {
        bg: BG_DARK + "19",
        boxShadow: BOX_SHADOW_LIGHT,
        border: "none",
      },
    },
    sidebar: {
      left: {
        default: {
          bg: `linear-gradient(to right, ${BG_DEFAULT}, ${BG_LIGHT})`,
        },
      },
      right: {
        default: {
          bg: `linear-gradient(45deg, ${BG_DARK}, ${BG_LIGHT})`,
          otherBg: `linear-gradient(315deg, ${BG_DEFAULT}, ${BG_LIGHT})`,
        },
      },
    },
    skeleton: {
      bg: BG_LIGHT,
      highlightColor: BG_DEFAULT,
    },
    progressbar: {
      indicator: {
        bg: PROGRESS_BG,
      },
    },
    toast: {
      progress: {
        bg: PROGRESS_BG,
      },
    },
  },
  highlight: {
    typeName: { color: CYAN, fontStyle: "italic" },
    variableName: { color: TEXT_PRIMARY },
    namespace: { color: CYAN },
    macroName: { color: H_GREEN },
    functionCall: { color: H_GREEN },
    functionDef: { color: H_GREEN },
    functionArg: { color: TEXT_PRIMARY },
    definitionKeyword: { color: BLUE },
    moduleKeyword: { color: BLUE },
    modifier: { color: BLUE },
    controlKeyword: { color: H_PURPLE },
    operatorKeyword: { color: H_PURPLE },
    keyword: { color: BLUE },
    self: { color: BLUE },
    bool: { color: H_PINK, fontStyle: "italic" },
    integer: { color: H_PINK },
    literal: { color: H_PINK },
    string: { color: H_YELLOW },
    character: { color: H_YELLOW },
    operator: { color: H_PURPLE },
    derefOperator: { color: H_PURPLE },
    specialVariable: { color: H_PURPLE },
    lineComment: { color: COMMENT, fontStyle: "italic" },
    blockComment: { color: COMMENT, fontStyle: "italic" },
    meta: { color: H_LIGHT_BLUE },
    invalid: { color: RED },
    constant: { color: TEXT_PRIMARY },
    regexp: { color: YELLOW },
    tagName: { color: YELLOW },
    attributeName: { color: YELLOW },
    attributeValue: { color: YELLOW },
    annotion: { color: YELLOW },
  },
};

export default PLAYGROUND;
