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
  bg?: ButtonBg;
  color?: ButtonColor;
  hoverColor?: ButtonColor;
  fontWeight?: CSSProperties["fontWeight"];
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, btnLoading, leftIcon, rightIcon, children, ...props }, ref) => (
    <StyledButton
      ref={ref}
      className={`${className} ${btnLoading ? "btn-loading" : ""}`}
      {...props}
    >
      <span className="btn-spinner" />
      {leftIcon && <span className="left-icon">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="right-icon">{rightIcon}</span>}
    </StyledButton>
  )
);

const StyledButton = styled.button<ButtonProps>`
  ${(props) => getButtonStyles(props)}
`;

const getButtonStyles = ({
  theme,
  kind = "outline",
  size,
  fullWidth,
  bg: _bg,
  color: _color,
  hoverColor: _hoverColor,
  fontWeight: _fontWeight,
}: ButtonProps & { theme: DefaultTheme }) => {
  let bg = theme.components?.button?.default?.bg;
  let color = theme.components?.button?.default?.color;
  let borderColor = theme.components?.button?.default?.borderColor;
  let borderRadius = theme.components?.button?.default?.borderRadius;
  let padding = theme.components?.button?.default?.padding;
  let fontSize = theme.components?.button?.default?.fontSize;
  let fontWeight = theme.components?.button?.default?.fontWeight;
  let boxShadow = theme.components?.button?.default?.boxShadow;

  let hoverBg = theme.components?.button?.default?.hover?.bg;
  let hoverColor = theme.components?.button?.default?.hover?.color;
  let hoverBorderColor = theme.components?.button?.default?.hover?.borderColor;
  let hoverBorderRadius =
    theme.components?.button?.default?.hover?.borderRadius;
  let hoverPadding = theme.components?.button?.default?.hover?.padding;
  let hoverFontSize = theme.components?.button?.default?.hover?.fontSize;
  let hoverFontWeight = theme.components?.button?.default?.hover?.fontWeight;
  let hoverBoxShadow = theme.components?.button?.default?.hover?.boxShadow;

  // Kind
  switch (kind) {
    case "primary": {
      bg = theme.colors.default.primary;
      hoverBg = theme.colors.default.primary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary": {
      bg = theme.colors.default.secondary;
      hoverBg = theme.colors.default.secondary + "E0";
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-transparent": {
      bg =
        theme.colors.default.primary +
        (theme.isDark ? theme.transparency?.medium : theme.transparency?.high);
      hoverBg =
        theme.colors.default.primary +
        (theme.isDark ? theme.transparency?.high : theme.transparency?.medium);
      padding = "0.5rem 1.25rem";
      break;
    }
    case "secondary-transparent": {
      bg = theme.colors.default.secondary + theme.transparency?.medium;
      hoverBg = theme.colors.default.secondary + theme.transparency?.high;
      padding = "0.5rem 1.25rem";
      break;
    }
    case "error": {
      bg =
        theme.colors.state.error.color +
        (theme.isDark ? theme.transparency?.high : "");
      hoverBg =
        theme.colors.state.error.color +
        (theme.isDark ? "" : theme.transparency?.high);
      padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-outline": {
      borderColor = theme.colors.default.primary;
      hoverBg = theme.colors.default.primary + "E0";
      break;
    }
    case "secondary-outline": {
      borderColor = theme.colors.default.secondary;
      hoverBg = theme.colors.default.secondary + "E0";
      break;
    }
    case "outline": {
      borderColor = theme.colors.default.borderColor;
      hoverBg = theme.colors.state.hover.bg;
      hoverBorderColor = theme.colors.default.borderColor;
      break;
    }
    case "icon": {
      color = theme.colors.default.textSecondary;
      hoverBg = theme.colors.state.hover.bg;
      hoverColor = theme.colors.default.textPrimary;
      padding = "0.25rem";
      break;
    }
    case "transparent": {
      hoverBorderColor = theme.colors.default.borderColor;
      padding = "0.5rem 0.75rem";
      break;
    }
    case "no-border": {
      color = theme.colors.default.textSecondary;
      hoverColor = theme.colors.default.textPrimary;
      padding = "0";
      break;
    }
  }

  // Button kind specific overrides
  // NOTE: Overrides must come after setting the `ButtonKind` defaults
  for (const buttonKind in theme.components?.button?.overrides) {
    if (buttonKind === kind) {
      // Default
      if (theme.components?.button?.overrides[buttonKind]?.bg) {
        bg = theme.components.button.overrides[buttonKind]!.bg;
      }
      if (theme.components?.button?.overrides[buttonKind]?.color) {
        color = theme.components.button.overrides[buttonKind]!.color;
      }
      if (theme.components?.button?.overrides[buttonKind]?.borderColor) {
        borderColor =
          theme.components.button.overrides[buttonKind]!.borderColor;
      }
      if (theme.components?.button?.overrides[buttonKind]?.borderRadius) {
        borderRadius =
          theme.components.button.overrides[buttonKind]!.borderRadius;
      }
      if (theme.components?.button?.overrides[buttonKind]?.padding) {
        padding = theme.components.button.overrides[buttonKind]!.padding;
      }
      if (theme.components?.button?.overrides[buttonKind]?.fontSize) {
        fontSize = theme.components.button.overrides[buttonKind]!.fontSize;
      }
      if (theme.components?.button?.overrides[buttonKind]?.fontWeight) {
        fontWeight = theme.components.button.overrides[buttonKind]!.fontWeight;
      }
      if (theme.components?.button?.overrides[buttonKind]?.boxShadow) {
        boxShadow = theme.components.button.overrides[buttonKind]!.boxShadow;
      }

      // Hover
      if (theme.components?.button?.overrides[buttonKind]?.hover?.bg) {
        hoverBg = theme.components.button.overrides[buttonKind]!.hover!.bg;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.color) {
        hoverColor =
          theme.components.button.overrides[buttonKind]!.hover!.color;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.borderColor) {
        hoverBorderColor =
          theme.components.button.overrides[buttonKind]!.hover!.borderColor;
      }
      if (
        theme.components?.button?.overrides[buttonKind]?.hover?.borderRadius
      ) {
        hoverBorderRadius =
          theme.components.button.overrides[buttonKind]!.hover!.borderRadius;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.padding) {
        hoverPadding =
          theme.components.button.overrides[buttonKind]!.hover!.padding;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.fontSize) {
        hoverFontSize =
          theme.components.button.overrides[buttonKind]!.hover!.fontSize;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.fontWeight) {
        hoverFontWeight =
          theme.components.button.overrides[buttonKind]!.hover!.fontWeight;
      }
      if (theme.components?.button?.overrides[buttonKind]?.hover?.boxShadow) {
        hoverBoxShadow =
          theme.components.button.overrides[buttonKind]!.hover!.boxShadow;
      }
    }
  }

  // NOTE: Arguments must come after the defaults and overrides

  // Size
  if (size || !padding) {
    if (size === "large") padding = "0.75rem 1.5rem";
    else if (size === "medium") padding = "0.5rem 1.25rem";
    else padding = "0.5rem 0.75rem";
  }

  // Bg color
  if (_bg) {
    switch (_bg) {
      case "primary":
        bg = theme.colors.default.primary;
        break;
      case "secondary":
        bg = theme.colors.default.secondary;
        break;
      case "success":
        bg = theme.colors.state.success.bg;
        break;
      case "error":
        bg = theme.colors.state.error.bg;
        break;
      case "info":
        bg = theme.colors.state.info.bg;
        break;
      case "warning":
        bg = theme.colors.state.warning.bg;
    }
  }

  // Color
  if (_color) {
    switch (_color) {
      case "primary":
        color = theme.colors.default.primary + theme.transparency?.high;
        hoverColor = theme.colors.default.primary;
        break;
      case "secondary":
        color = theme.colors.default.secondary + theme.transparency?.high;
        hoverColor = theme.colors.default.secondary;
        break;
      case "success":
        color = theme.colors.state.success.color + theme.transparency?.high;
        hoverColor = theme.colors.state.success.color;
        break;
      case "error":
        color = theme.colors.state.error.color + theme.transparency?.high;
        hoverColor = theme.colors.state.error.color;
        break;
      case "info":
        color = theme.colors.state.info.color + theme.transparency?.high;
        hoverColor = theme.colors.state.info.color;
        break;
      case "warning":
        color = theme.colors.state.warning.color + theme.transparency?.high;
        hoverColor = theme.colors.state.warning.color;
        break;
      case "textPrimary":
        color = theme.colors.default.textPrimary;
        break;
      case "textSecondary":
        color = theme.colors.default.textSecondary;
        break;
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

  if (_fontWeight) {
    fontWeight = _fontWeight;
    hoverFontWeight = fontWeight;
  }

  let defaultCss = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: ${padding};
    background: ${bg};
    color: ${color};
    border: 1px solid ${borderColor};
    border-radius: ${borderRadius};
    font-size: ${fontSize};
    font-weight: ${fontWeight};
    box-shadow: ${boxShadow};
    transition: all ${theme.transition?.duration.medium}
      ${theme.transition?.type};

    & svg {
      color: ${color};
    }

    &:hover {
      ${hoverBg && `background: ${hoverBg}`};
      ${hoverColor && `color: ${hoverColor}`};
      ${hoverBorderColor && `border: 1px solid ${hoverBorderColor}`};
      ${hoverBorderRadius && `border-radius: ${hoverBorderRadius}`};
      ${hoverPadding && `padding: ${hoverPadding}`};
      ${hoverFontSize && `font-size: ${hoverFontSize}`};
      ${hoverFontWeight && `font-weight: ${hoverFontWeight}`};
      ${hoverBoxShadow && `box-shadow: ${hoverBoxShadow}`};

      & svg {
        color: ${hoverColor};
      }
    }

    &:disabled {
      cursor: not-allowed;
      background: ${theme.colors.state.disabled.bg};
      color: ${theme.colors.state.disabled.color};

      &:hover {
        cursor: not-allowed;
        background: ${theme.colors.state.disabled.bg};
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
  if (fullWidth) {
    defaultCss = defaultCss.concat(css`
      width: 100%;
    `);
  }

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

      & > span:not(.btn-spinner) {
        margin: 0 0.25rem 0 0.375rem;
      }
    `);
  }

  return defaultCss;
};

export default Button;
