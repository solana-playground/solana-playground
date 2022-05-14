import styled, { css, DefaultTheme } from "styled-components";

export type ButtonKind =
  | "primary"
  | "secondary"
  | "primary-outline"
  | "secondary-outline"
  | "primary-transparent"
  | "secondary-transparent"
  | "outline"
  | "transparent"
  | "icon";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  fullWidth?: boolean;
  bold?: boolean;
}

const getButtonStyles = (
  theme: DefaultTheme,
  kind?: ButtonKind,
  size?: ButtonSize,
  fullWidth?: boolean,
  bold?: boolean
) => {
  let color = "inherit";
  let bgColor = "transparent";
  let borderColor = "transparent";

  let hoverBgColor = theme.colors.default.primary;
  let hoverColor = "inherit";
  let hoverBorderColor = "transparent";

  let padding = "0.5rem 0.75rem";

  // Kind
  switch (kind) {
    case "primary": {
      if (theme.colors.contrast?.primary) color = theme.colors.contrast.color;
      bgColor = theme.colors.default.primary;
      hoverBgColor += "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary": {
      if (theme.colors.contrast?.secondary) color = theme.colors.contrast.color;
      bgColor = theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-outline": {
      borderColor = theme.colors.default.primary;
      hoverBgColor += "E0";
      break;
    }
    case "secondary-outline": {
      borderColor = theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      break;
    }
    case "primary-transparent": {
      bgColor = theme.colors.default.primary + theme.transparency?.medium;
      hoverBgColor += theme.transparency?.high;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary-transparent": {
      bgColor = theme.colors.default.secondary + theme.transparency?.medium;
      hoverBgColor = theme.colors.default.secondary + theme.transparency?.high;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "outline": {
      borderColor = theme.colors.default.borderColor;
      hoverBgColor = theme.colors.right?.otherBg ?? "transparent";
      hoverBorderColor = theme.colors.default.borderColor;
      break;
    }
    case "icon": {
      padding = "0.25rem";
      color = theme.colors.default.textSecondary;
      hoverBgColor = "transparent";
      break;
    }
    // Transparent
    default: {
      hoverBgColor = "transparent";
      hoverBorderColor = theme.colors.default.borderColor;
    }
  }

  // Size
  if (size === "medium") padding = "0.5rem 1.25rem";
  else if (size === "large") padding = "0.75rem 1.5rem";

  let defaultCss = css`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${theme.borderRadius};
    cursor: pointer;
    padding: ${padding};
    background-color: ${bgColor};
    color: ${color};
    border: 1px solid ${borderColor};

    &:hover {
      background-color: ${hoverBgColor};
      color: ${hoverColor};
      border: 1px solid ${hoverBorderColor};
    }

    &:disabled {
      cursor: not-allowed;
      background-color: ${theme.colors.state.disabled.bg};
      color: ${theme.colors.state.disabled.color};

      &:hover {
        cursor: not-allowed;
        background-color: ${theme.colors.state.disabled.bg};
        color: ${theme.colors.state.disabled.color};
      }
    }
  `;

  // FullWidth
  if (fullWidth)
    defaultCss = defaultCss.concat(css`
      width: 100%;
    `);

  // Bold
  if (bold)
    defaultCss = defaultCss.concat(css`
      font-weight: bold;
    `);

  if (kind === "icon")
    defaultCss = defaultCss.concat(css`
      display: flex;
      justify-content: center;
      align-items: center;

      & img,
      svg {
        width: 1rem;
        height: 1rem;
      }

      &:hover {
        color: ${theme.colors.default.textPrimary};
        background-color: ${theme.colors.state.hover.bg};
      }
    `);

  return defaultCss;
};

const Button = styled.button<ButtonProps>`
  ${({ theme, kind, size, fullWidth, bold }) =>
    getButtonStyles(theme, kind, size, fullWidth, bold)}
`;

export default Button;
