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

    contrast?: {
      color: string;
      primary?: boolean;
      secondary?: boolean;
    };

    // Icon panel
    left?: BgAndColor; // bgPrimary, textPrimary

    // Side right panel
    right?: BgAndColor & { otherBg?: string };

    // Terminal
    terminal?: BgAndColor & { cursorColor?: string; selectionBg?: string };

    // Editor
    editor?: {
      bg?: string; // bgPrimary
      color?: string; // textPrimary
      cursor?: {
        color: string; // textSecondary
      };
      selection?: BgAndColor;
      comment?: BgAndColor;
      searchMatch?: {
        bg?: string;
        color?: string;
        selectedBg?: string;
        selectedColor?: string;
      };
      activeLine?: {
        bg?: string;
        color?: string;
        borderColor?: string;
      };
      gutter?: {
        bg?: string;
        color?: string;
        activeBg?: string;
        activeColor?: string;
      };
      tooltip?: {
        bg?: string;
        color?: string;
        selectedBg?: string;
        selectedColor?: string;
      };
    };

    // Bottom bar
    bottom?: BgAndColor; // primary, textPrimary

    // Left sidebar IconButton
    iconButton?: {
      bg?: string;
      color?: string;
      selectedBg?: string;
      selectedBorderColor?: string;
    };

    tooltip?: BgAndColor;

    toast?: BgAndColor;

    home?: {
      bg?: string; // bgPrimary
      color?: string; // textPrimary
      card?: {
        bg?: string; // bgSecondary
        color?: string; // textSecondary
      };
    };
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
