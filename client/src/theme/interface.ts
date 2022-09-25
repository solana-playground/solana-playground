import { HighlightStyle } from "@codemirror/language";

type BgAndColor = {
  bg?: string;
  color?: string;
};

export type Font = {
  family: string;
  size: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
};

export type Scrollbar = {
  thumb: {
    color: string;
    hoverColor: string;
  };
  width?: {
    editor: string;
  };
};

export type Transition = {
  type: string;
  duration: {
    short: string;
    medium: string;
    long: string;
  };
};

export type Transparency = {
  low: string;
  medium: string;
  high: string;
};

export type Skeleton = {
  color: string;
  highlightColor: string;
};

export default interface Theme {
  name: string;
  isDark: boolean;
  colors: {
    // Defaults
    default: {
      primary: string;
      secondary: string;
      bgPrimary: string;
      bgSecondary: string;
      textPrimary: string;
      textSecondary: string;
      borderColor: string;
    };

    state: {
      hover: BgAndColor;
      disabled: BgAndColor;
      error: BgAndColor;
      success: BgAndColor;
      warning: BgAndColor;
      info: BgAndColor;
    };

    // Bottom bar
    bottom?: BgAndColor; // primary, textPrimary

    // Contrast
    contrast?: {
      color: string;
      primary?: boolean;
      secondary?: boolean;
    };

    // Editor
    editor?: BgAndColor & {
      cursorColor?: string; // textSecondary
      selection?: BgAndColor;
      comment?: BgAndColor;
      searchMatch?: BgAndColor & {
        selectedBg?: string;
        selectedColor?: string;
      };
      activeLine?: BgAndColor & {
        borderColor?: string;
      };
      gutter?: BgAndColor & {
        activeBg?: string;
        activeColor?: string;
      };
      tooltip?: BgAndColor & {
        selectedBg?: string;
        selectedColor?: string;
      };
    };

    // Home screen
    home?: BgAndColor & {
      card?: BgAndColor;
    };

    // Left sidebar IconButton
    iconButton?: BgAndColor & {
      selectedBg?: string;
      selectedBorderColor?: string;
    };

    // Input
    input?: BgAndColor & {
      borderColor?: string;
      outlineColor?: string;
    };

    // Icon panel
    left?: BgAndColor; // bgPrimary, textPrimary

    // Side right panel
    right?: BgAndColor & { otherBg?: string };

    // Terminal
    terminal?: BgAndColor & { cursorColor?: string; selectionBg?: string };

    // Notification toast
    toast?: BgAndColor;

    // General tooltip
    tooltip?: BgAndColor;
  };

  borderRadius?: string;
  boxShadow?: string;
  font?: Font;
  scrollbar?: Scrollbar;
  skeleton?: Skeleton;
  transparency?: Transparency;
  transition?: Transition;
  highlight: HighlightStyle;
}
