import { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";
import styled, { css, CSSProperties, DefaultTheme } from "styled-components";

import { spinnerAnimation } from "../Loading";

export type ButtonKind =
  | "primary"
  | "secondary"
  | "error"
  | "primary-transparent"
  | "secondary-transparent"
  | "primary-outline"
  | "secondary-outline"
  | "outline"
  | "transparent"
  | "no-border"
  | "icon";

export type ButtonSize = "small" | "medium" | "large";

type ButtonColor =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "textPrimary"
  | "textSecondary";

type ButtonBg =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  kind?: ButtonKind;
  size?: ButtonSize;
  fullWidth?: boolean;
  btnLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fontWeight?: CSSProperties["fontWeight"];
  bg?: ButtonBg;
  color?: ButtonColor;
  hoverColor?: ButtonColor;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <StyledButton
    ref={ref}
    className={`${props.className ? props.className : ""} ${
      props.btnLoading ? "btn-loading" : ""
    }`}
    {...props}
  >
    <span className="btn-spinner" />
    {props.leftIcon && <span className="left-icon">{props.leftIcon}</span>}
    {props.children}
    {props.rightIcon && <span className="right-icon">{props.rightIcon}</span>}
  </StyledButton>
));

const StyledButton = styled.button<ButtonProps>`
  ${(props) => getButtonStyles(props)}
`;

const getButtonStyles = ({
  theme,
  kind = "outline",
  size,
  fullWidth,
  fontWeight,
  bg,
  color,
  hoverColor: _hoverColor,
}: ButtonProps & { theme: DefaultTheme }) => {
  let textColor: CSSProperties["color"] = "inherit";
  let bgColor: CSSProperties["backgroundColor"] = "transparent";
  let borderColor: CSSProperties["borderColor"] = "transparent";

  let hoverBgColor: CSSProperties["backgroundColor"] = "transparent";
  let hoverColor: CSSProperties["color"] = "inherit";
  let hoverBorderColor: CSSProperties["borderColor"] = "transparent";

  let padding: CSSProperties["padding"] = "";

  // Kind
  switch (kind) {
    case "primary": {
      if (theme.colors.contrast?.primary) {
        textColor = theme.colors.contrast.color;
      }
      bgColor = theme.colors.default.primary;
      hoverBgColor = theme.colors.default.primary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary": {
      if (theme.colors.contrast?.secondary) {
        textColor = theme.colors.contrast.color;
      }
      bgColor = theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-transparent": {
      bgColor = theme.colors.default.primary + theme.transparency?.medium;
      hoverBgColor = theme.colors.default.primary + theme.transparency?.high;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary-transparent": {
      bgColor = theme.colors.default.secondary + theme.transparency?.medium;
      hoverBgColor = theme.colors.default.secondary + theme.transparency?.high;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "error": {
      bgColor = theme.colors.state.error.color + theme.transparency?.high;
      hoverBgColor = theme.colors.state.error.color;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-outline": {
      borderColor = theme.colors.default.primary;
      hoverBgColor = theme.colors.default.primary + "E0";
      break;
    }
    case "secondary-outline": {
      borderColor = theme.colors.default.secondary;
      hoverBgColor = theme.colors.default.secondary + "E0";
      break;
    }
    case "outline": {
      borderColor = theme.colors.default.borderColor;
      hoverBgColor = theme.colors.state.hover.bg ?? "transparent";
      hoverBorderColor = theme.colors.default.borderColor;
      break;
    }
    case "icon": {
      textColor = theme.colors.default.textSecondary;
      padding = "0.25rem";
      break;
    }
    case "transparent": {
      hoverBorderColor = theme.colors.default.borderColor;
      padding = "0.5rem 0.75rem";
      break;
    }
    case "no-border": {
      textColor = theme.colors.default.textSecondary;
      hoverColor = theme.colors.default.textPrimary;
      padding = "0";
      break;
    }
  }

  // Size
  if (size || !padding) {
    if (size === "large") padding = "0.75rem 1.5rem";
    else if (size === "medium") padding = "0.5rem 1.25rem";
    else padding = "0.5rem 0.75rem";
  }

  // Bg color
  if (bg) {
    switch (bg) {
      case "primary":
        bgColor = theme.colors.default.primary;
        break;
      case "secondary":
        bgColor = theme.colors.default.secondary;
        break;
      case "success":
        bgColor = theme.colors.state.success.bg;
        break;
      case "error":
        bgColor = theme.colors.state.error.bg;
        break;
      case "info":
        bgColor = theme.colors.state.info.bg;
        break;
      case "warning":
        bgColor = theme.colors.state.warning.bg;
    }
  }

  // Color
  if (color) {
    switch (color) {
      case "primary":
        textColor = theme.colors.default.primary + theme.transparency?.high;
        hoverColor = theme.colors.default.primary;
        break;
      case "secondary":
        textColor = theme.colors.default.secondary + theme.transparency?.high;
        hoverColor = theme.colors.default.secondary;
        break;
      case "success":
        textColor = theme.colors.state.success.color + theme.transparency?.high;
        hoverColor = theme.colors.state.success.color;
        break;
      case "error":
        textColor = theme.colors.state.error.color + theme.transparency?.high;
        hoverColor = theme.colors.state.error.color;
        break;
      case "info":
        textColor = theme.colors.state.info.color + theme.transparency?.high;
        hoverColor = theme.colors.state.info.color;
        break;
      case "warning":
        textColor = theme.colors.state.warning.color + theme.transparency?.high;
        hoverColor = theme.colors.state.warning.color;
        break;
      case "textPrimary":
        textColor = theme.colors.default.textPrimary;
        break;
      case "textSecondary":
        textColor = theme.colors.default.textSecondary;
    }
  }

  // Hover color
  if (_hoverColor) {
    switch (_hoverColor) {
      case "primary":
        hoverColor = theme.colors.default.primary;
        break;
      case "secondary":
        hoverColor = theme.colors.default.secondary;
        break;
      case "success":
        hoverColor = theme.colors.state.success.color;
        break;
      case "error":
        hoverColor = theme.colors.state.error.color;
        break;
      case "info":
        hoverColor = theme.colors.state.info.color;
        break;
      case "warning":
        hoverColor = theme.colors.state.warning.color;
        break;
    }
  }

  let defaultCss = css`
    font-weight: ${fontWeight};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${theme.borderRadius};
    cursor: pointer;
    padding: ${padding};
    background-color: ${bgColor};
    color: ${textColor};
    border: 1px solid ${borderColor};
    position: relative;
    transition: all ${theme.transition?.duration.medium}
      ${theme.transition?.type};

    & svg {
      color: ${color} !important;
    }

    &:hover {
      background-color: ${hoverBgColor};
      color: ${hoverColor};
      border: 1px solid ${hoverBorderColor};

      & svg {
        color: ${hoverColor} !important;
      }
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

    /* Left Icon */
    & > span.left-icon {
      display: flex;

      & > * {
        margin-right: 0.25rem;
      }
    }

    /* Right Icon */
    & > span.right-icon {
      display: flex;

      & > * {
        margin-left: 0.25rem;
      }
    }

    /* Loading */
    & > span.btn-spinner {
      transform: scale(0);
    }

    &.btn-loading > span.btn-spinner {
      width: 1rem;
      height: 1rem;
      margin-right: 0.5rem;
      border: 3px solid transparent;
      border-top-color: ${theme.colors.default.primary};
      border-right-color: ${theme.colors.default.primary};
      border-radius: 50%;
      animation: ${spinnerAnimation} 0.5s linear infinite;
      transform: scale(1);
    }
  `;

  // FullWidth
  if (fullWidth)
    defaultCss = defaultCss.concat(css`
      width: 100%;
    `);

  if (kind === "icon") {
    defaultCss = defaultCss.concat(css`
      display: flex;
      justify-content: center;
      align-items: center;
      height: fit-content;
      width: fit-content;

      & img,
      svg {
        width: 1rem;
        height: 1rem;
      }

      &:hover {
        color: ${theme.colors.default.textPrimary};
        background-color: ${theme.colors.state.hover.bg};

        & svg {
          color: ${theme.colors.default.textPrimary};
        }
      }

      & > span:not(.btn-spinner) {
        margin: 0 0.25rem 0 0.375rem;
      }
    `);
  }

  return defaultCss;
};

export default Button;
