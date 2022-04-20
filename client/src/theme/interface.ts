import { HighlightStyle } from "@codemirror/highlight";

type BgAndColor = {
  bg?: string;
  color?: string;
};

export default interface Theme {
  name: string;
  isDark: boolean;
  colors: {
    // Defaults
    default: {
      bg: string;
      primary: string;
      secondary: string;
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
    conrast?: {
      color: string;
      primary?: boolean;
      secondary?: boolean;
    };
    // Icon panel
    left?: BgAndColor;
    // Side right panel
    right?: {
      bg?: string;
      color?: string;
      otherBg?: string;
    };
    // Terminal
    terminal?: BgAndColor;
    // Editor
    editor?: {
      bg?: string;
      text?: BgAndColor;
      cursor?: {
        color: string;
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
    bottom?: BgAndColor;
    // IconButton
    iconButton?: {
      bg?: string;
      color?: string;
      selectedBg?: string;
      selectedBorderColor?: string;
    };
    tooltip?: BgAndColor;
  };
  highlight: HighlightStyle;
  borderRadius?: string;
  font?: {
    family: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
  transparency?: {
    low: string;
    medium: string;
    high: string;
  };
}
