import { Scrollbar, Skeleton, Transition, Transparency } from "./interface";

export const PG_TRANSPARENCY: Transparency = {
  low: "16",
  medium: "64",
  high: "99",
};

export const PG_BORDER_RADIUS = "4px";

export const PG_SCROLLBAR: { [key: string]: Scrollbar } = {
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

export const PG_TRANSITION: Transition = {
  type: "linear",
  duration: {
    short: "50ms",
    medium: "150ms",
    long: "250ms",
  },
};

export const PG_SKELETON: Skeleton = {
  color: "#44475A",
  highlightColor: "#343746",
};
