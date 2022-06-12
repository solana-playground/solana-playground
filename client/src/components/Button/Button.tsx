import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import { spinnerAnimation } from "../Loading";

export type ButtonKind =
  | "primary"
  | "secondary"
  | "primary-transparent"
  | "secondary-transparent"
  | "primary-outline"
  | "secondary-outline"
  | "outline"
  | "transparent"
  | "icon";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  kind?: ButtonKind;
  size?: ButtonSize;
  fullWidth?: boolean;
  btnLoading?: boolean;
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
    {props.children}
  </StyledButton>
));

const StyledButton = styled.button<ButtonProps>`
  ${(props) => getButtonStyles(props)}
`;

const getButtonStyles = ({
  theme,
  kind = "transparent",
  size,
  fullWidth,
}: ButtonProps & { theme: DefaultTheme }) => {
  let color = "inherit";
  let bgColor = "transparent";
  let borderColor = "transparent";

  let hoverBgColor = "transparent";
  let hoverColor = "inherit";
  let hoverBorderColor = "transparent";

  let padding = "0.5rem 0.75rem";

  // Kind
  switch (kind) {
    case "primary": {
      if (theme.colors.contrast?.primary) color = theme.colors.contrast.color;
      bgColor = theme.colors.default.primary;
      hoverBgColor = theme.colors.default.primary + "E0";
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
      padding = "0.25rem";
      color = theme.colors.default.textSecondary;
      break;
    }
    case "transparent": {
      hoverBorderColor = theme.colors.default.borderColor;
      break;
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
    position: relative;
    transition: all ${theme.transition?.duration.medium}
      ${theme.transition?.type};

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
  }

  return defaultCss;
};

export default Button;
