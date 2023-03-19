import { PgFont, Scrollbar, Transition, Transparency } from "./interface";

export const DEFAULT_BOX_SHADOW = "rgb(0 0 0 / 25%) -1px 3px 4px";

export const DEFAULT_BORDER_RADIUS = "4px";

export const DEFAULT_SCROLLBAR: { [K in "dark" | "light"]: Scrollbar } = {
  dark: {
    thumb: {
      color: "#ffffff64",
      hoverColor: "#ffffff32",
    },
    width: {
      editor: "0.75rem",
    },
  },
  light: {
    thumb: {
      color: "#00000032",
      hoverColor: "#00000064",
    },
    width: {
      editor: "0.75rem",
    },
  },
};

export const DEFAULT_TRANSITION: Transition = {
  type: "linear",
  duration: {
    short: "50ms",
    medium: "150ms",
    long: "250ms",
  },
};

export const DEFAULT_TRANSPARENCY: Transparency = {
  low: "16",
  medium: "64",
  high: "BB",
};

export const DEFAULT_FONT_OTHER: PgFont = {
  family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`,
  size: {
    xsmall: "0.8125rem",
    small: "0.875rem",
    medium: "1rem",
    large: "1.25rem",
    xlarge: "1.5rem",
  },
};
