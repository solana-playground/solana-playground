import type { Theme } from "../../utils/pg";

// BG
const BG_BLACK = "#000000",
  // BG_WHITE = "#F9F9FB",
  BG_GRAY = "#18191E",
  // FG
  GREEN = "#14F195",
  PURPLE = "#9945FF",
  BLUE = "#80ECFF",
  PINK = "#EB54BC",
  ORANGE = "#F85228",
  RED = "#DC3545",
  YELLOW = "#FFC107",
  // TEXT
  TEXT_PRIMARY = "#FFFFFF",
  TEXT_SECONDARY = "#AAAAAA",
  // State
  DISABLED = "#111114",
  HOVER_BG = "#2B2D39",
  SELECTION = "#232323",
  // Highlight
  COMMENT = "#859188";

const NO_TRANSFORM = {
  "&:not(:disabled):hover": {
    transform: "none",
  },
};

const SOLANA: Theme = {
  isDark: true,
  colors: {
    default: {
      bgPrimary: BG_BLACK,
      bgSecondary: BG_GRAY,
      primary: GREEN,
      secondary: PURPLE,
      textPrimary: TEXT_PRIMARY,
      textSecondary: TEXT_SECONDARY,
      border: SELECTION,
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
        color: "#91939e",
      },
      info: {
        color: BLUE,
      },
      success: {
        color: GREEN,
      },
      warning: { color: YELLOW },
    },
  },
  default: {
    borderRadius: "12px",
  },
  components: {
    bottom: {
      default: {
        color: BG_BLACK,
      },
    },
    button: {
      default: {
        "&:not(:disabled):hover": {
          transform: "translateY(-3px)",
        },
      },
      overrides: {
        icon: NO_TRANSFORM,
        "no-border": NO_TRANSFORM,
        transparent: NO_TRANSFORM,
        primary: {
          color: BG_BLACK,
          hover: {
            color: TEXT_PRIMARY,
          },
        },
        outline: {
          border: `1px solid ${TEXT_PRIMARY}`,
          hover: {
            bg: TEXT_PRIMARY,
            borderColor: BG_BLACK,
            boxShadow:
              "0 1rem 2.5rem rgba(35, 35, 35, 0.1), 0 .5rem 1rem -0.75rem rgba(35, 35, 35, 0.1)",
            color: BG_BLACK,
          },
        },
      },
    },
    editor: {
      default: {
        bg: BG_GRAY,
      },
      gutter: {
        color: TEXT_SECONDARY,
        activeColor: TEXT_PRIMARY,
      },
      peekView: {
        title: {
          bg: BG_BLACK,
        },
        editor: {
          bg: BG_BLACK,
        },
      },
      tooltip: {
        bg: BG_BLACK,
      },
    },
    input: {
      padding: "0.375rem 0.625rem",
    },
    main: {
      default: {
        bg: BG_BLACK,
      },
      primary: {
        home: {
          resources: {
            card: {
              default: {
                bg: BG_GRAY,
              },
            },
          },
          tutorials: {
            card: {
              bg: BG_GRAY,
            },
          },
        },
        tutorials: {
          main: {
            default: {
              bg: BG_BLACK,
              border: `1px solid ${SELECTION}`,
            },
            content: {
              card: {
                default: {
                  bg: BG_GRAY,
                },
              },
            },
          },
        },
      },
    },
    menu: {
      default: {
        bg: BG_GRAY,
      },
    },
    sidebar: {
      right: {
        default: {
          bg: BG_BLACK,
          otherBg: BG_GRAY,
        },
      },
    },
    skeleton: {
      bg: SELECTION,
      highlightColor: HOVER_BG,
    },
    tabs: {
      tab: {
        current: {
          bg: BG_GRAY,
        },
      },
    },
    terminal: {
      default: {
        bg: BG_GRAY,
      },
    },
    toast: {
      default: {
        bg: BG_GRAY,
      },
    },
    tooltip: {
      bg: BG_GRAY,
      bgSecondary: BG_BLACK,
    },
    wallet: {
      default: {
        bg: BG_BLACK,
      },
      main: {
        transactions: {
          table: {
            default: {
              bg: BG_GRAY,
            },
            header: {
              bg: BG_BLACK,
            },
          },
        },
      },
    },
  },
  highlight: {
    typeName: { color: BLUE, fontStyle: "italic" },
    variableName: { color: TEXT_PRIMARY },
    namespace: { color: BLUE },
    macroName: { color: GREEN },
    functionCall: { color: GREEN },
    functionDef: { color: GREEN },
    functionArg: { color: TEXT_PRIMARY },
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

export default SOLANA;
