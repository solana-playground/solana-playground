import styled, { css, DefaultTheme } from "styled-components";

export type ButtonKind =
  | "primary"
  | "secondary"
  | "primary-outline"
  | "secondary-outline"
  | "transparent"
  | "icon";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const getButtonStyles = (
  theme: DefaultTheme,
  kind?: ButtonKind,
  size?: ButtonSize,
  fullWidth?: boolean
) => {
  let color = "inherit";
  let bgColor = "transparent";
  let hoverBgColor = theme.colors.default.primary;
  let border = "none";
  let padding = "0.5rem 0.75rem";

  // Kind
  switch (kind) {
    case "primary": {
      if (theme.colors.conrast?.primary) color = theme.colors.conrast.color;
      bgColor = theme.colors.default.primary;
      hoverBgColor += "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary": {
      if (theme.colors.conrast?.secondary) color = theme.colors.conrast.color;
      bgColor = theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-outline": {
      border = "1px solid " + theme.colors.default.primary;
      hoverBgColor += "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary-outline": {
      border = "1px solid " + theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "icon": {
      padding = "0.25rem";
      color = theme.colors.default.textSecondary;
      hoverBgColor = "transparent";

      break;
    }
    default: {
      hoverBgColor = theme.colors.default.primary + theme.transparency?.medium;
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
    color: ${color};
    background-color: ${bgColor};
    border: ${border};

    &:hover {
      background-color: ${hoverBgColor};
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

  if (kind === "icon")
    defaultCss = defaultCss.concat(css`
      display: flex;
      justify-content: center;
      align-items: center;

      & img {
        width: 1rem;
        height: 1rem;
      }
    `);

  return defaultCss;
};

const Button = styled.button<ButtonProps>`
  ${({ theme, kind, size, fullWidth }) =>
    getButtonStyles(theme, kind, size, fullWidth)}
`;

export default Button;
