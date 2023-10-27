import {
  ComponentPropsWithoutRef,
  forwardRef,
  MouseEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import styled, { css, CSSProperties, DefaultTheme } from "styled-components";

import { spinnerAnimation } from "../Loading";
import { ClassName } from "../../constants";
import { PgTheme } from "../../utils/pg";

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
  /** Button kind */
  kind?: ButtonKind;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button should take the full width of the parent element */
  fullWidth?: boolean;
  /** Loading state */
  btnLoading?:
    | boolean
    | {
        /** Whether the button is in loading state */
        state?: boolean;
        /** Text to show when the button is in loading state */
        text?: string;
      };
  /** Left Icon */
  leftIcon?: ReactNode;
  /** Right Icon */
  rightIcon?: ReactNode;
  /** Background override */
  bg?: ButtonBg;
  /** Color override */
  color?: ButtonColor;
  /** Hover color override */
  hoverColor?: ButtonColor;
  /** Font weight override */
  fontWeight?: CSSProperties["fontWeight"];
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      btnLoading,
      className,
      disabled,
      leftIcon,
      rightIcon,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(getIsLoading(btnLoading));
    const [isDisabled, setIsDisabled] = useState(disabled);

    // Manage manual loading state
    useEffect(() => {
      const res = getIsLoading(btnLoading);
      if (res !== undefined) setIsLoading(res);
    }, [btnLoading]);

    // Disable when manually set or is loading
    useEffect(() => {
      setIsDisabled(disabled || isLoading);
    }, [disabled, isLoading]);

    const handleOnClick = async (ev: MouseEvent<HTMLButtonElement>) => {
      const shouldSetIsDisabled = getIsLoading(btnLoading) === undefined;
      const shouldSetIsLoading = shouldSetIsDisabled && props.kind !== "icon";

      try {
        if (shouldSetIsDisabled) setIsDisabled(true);
        if (shouldSetIsLoading) setIsLoading(true);
        await onClick?.(ev);
      } finally {
        if (shouldSetIsDisabled) setIsDisabled(false);
        if (shouldSetIsLoading) setIsLoading(false);
      }
    };

    return (
      <StyledButton
        ref={ref}
        className={`${className} ${isLoading ? ClassName.BUTTON_LOADING : ""}`}
        disabled={isDisabled}
        onClick={handleOnClick}
        {...props}
      >
        <span className="btn-spinner" />
        {leftIcon && <span className="left-icon">{leftIcon}</span>}

        {isLoading
          ? typeof btnLoading === "object"
            ? btnLoading.text ?? children
            : children
          : children}

        {rightIcon && <span className="right-icon">{rightIcon}</span>}
      </StyledButton>
    );
  }
);

/** Get whether the button is currently in a loading state */
const getIsLoading = (btnLoading: ButtonProps["btnLoading"]) => {
  return typeof btnLoading === "object" ? btnLoading.state : btnLoading;
};

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
  // Clone the default Button theme to not override the global object
  let button = structuredClone(theme.components.button.default);

  // Kind
  switch (kind) {
    case "primary": {
      button.padding = "0.5rem 1.25rem";
      button.bg = theme.colors.default.primary;
      button.hover!.bg = theme.colors.default.primary + "E0";
      break;
    }
    case "secondary": {
      button.bg = theme.colors.default.secondary;
      button.hover!.bg = theme.colors.default.secondary + "E0";
      button.padding = "0.5rem 1.25rem";
      break;
    }
    case "primary-transparent": {
      button.padding = "0.5rem 1.25rem";
      button.bg =
        theme.colors.default.primary +
        (theme.isDark
          ? theme.default.transparency.medium
          : theme.default.transparency.high);
      button.hover!.bg =
        theme.colors.default.primary +
        (theme.isDark
          ? theme.default.transparency.high
          : theme.default.transparency.medium);
      break;
    }
    case "secondary-transparent": {
      button.padding = "0.5rem 1.25rem";
      button.bg =
        theme.colors.default.secondary + theme.default.transparency.medium;
      button.hover!.bg =
        theme.colors.default.secondary + theme.default.transparency.high;
      break;
    }
    case "error": {
      button.padding = "0.5rem 1.25rem";
      button.bg =
        theme.colors.state.error.color +
        (theme.isDark ? theme.default.transparency.high : "");
      button.hover!.bg =
        theme.colors.state.error.color +
        (theme.isDark ? "" : theme.default.transparency.high);
      break;
    }
    case "primary-outline": {
      button.borderColor = theme.colors.default.primary;
      button.hover!.bg = theme.colors.default.primary + "E0";
      break;
    }
    case "secondary-outline": {
      button.borderColor = theme.colors.default.secondary;
      button.hover!.bg = theme.colors.default.secondary + "E0";
      break;
    }
    case "outline": {
      button.borderColor = theme.colors.default.border;
      button.hover!.bg = theme.colors.state.hover.bg;
      button.hover!.borderColor = theme.colors.default.border;
      break;
    }
    case "icon": {
      button.padding = "0.25rem";
      button.color = theme.colors.default.textSecondary;
      button.hover!.bg = theme.colors.state.hover.bg;
      button.hover!.color = theme.colors.default.textPrimary;
      break;
    }
    case "transparent": {
      button.padding = "0.5rem 0.75rem";
      button.hover!.borderColor = theme.colors.default.border;
      break;
    }
    case "no-border": {
      button.padding = "0";
      button.color = theme.colors.default.textSecondary;
      button.hover!.color = theme.colors.default.textPrimary;
      break;
    }
  }

  // Button kind specific overrides
  // NOTE: Overrides must come after setting the `ButtonKind` defaults
  button = PgTheme.overrideDefaults(
    button,
    theme.components.button.overrides?.[kind]
  );

  // NOTE: Props must come after the defaults and overrides

  // Size prop
  if (size || !button.padding) {
    if (size === "large") button.padding = "0.75rem 1.5rem";
    else if (size === "medium") button.padding = "0.5rem 1.25rem";
    else if (size === "small") button.padding = "0.25rem 0.75rem";
    else button.padding = "0.5rem 0.75rem";
  }

  // Font weight prop
  if (_bg) {
    switch (_bg) {
      case "primary":
        button.bg = theme.colors.default.primary;
        break;
      case "secondary":
        button.bg = theme.colors.default.secondary;
        break;
      case "success":
        button.bg = theme.colors.state.success.bg;
        break;
      case "error":
        button.bg = theme.colors.state.error.bg;
        break;
      case "info":
        button.bg = theme.colors.state.info.bg;
        break;
      case "warning":
        button.bg = theme.colors.state.warning.bg;
    }
  }

  // Font weight prop
  if (_color) {
    switch (_color) {
      case "primary":
        button.color =
          theme.colors.default.primary + theme.default.transparency.high;
        button.hover!.color = theme.colors.default.primary;
        break;
      case "secondary":
        button.color =
          theme.colors.default.secondary + theme.default.transparency.high;
        button.hover!.color = theme.colors.default.secondary;
        break;
      case "success":
        button.color =
          theme.colors.state.success.color + theme.default.transparency.high;
        button.hover!.color = theme.colors.state.success.color;
        break;
      case "error":
        button.color =
          theme.colors.state.error.color + theme.default.transparency.high;
        button.hover!.color = theme.colors.state.error.color;
        break;
      case "info":
        button.color =
          theme.colors.state.info.color + theme.default.transparency.high;
        button.hover!.color = theme.colors.state.info.color;
        break;
      case "warning":
        button.color =
          theme.colors.state.warning.color + theme.default.transparency.high;
        button.hover!.color = theme.colors.state.warning.color;
        break;
      case "textPrimary":
        button.color = theme.colors.default.textPrimary;
        break;
      case "textSecondary":
        button.color = theme.colors.default.textSecondary;
    }
  }

  // Font weight prop
  if (_hoverColor) {
    switch (_hoverColor) {
      case "primary":
        button.hover!.color = theme.colors.default.primary;
        break;
      case "secondary":
        button.hover!.color = theme.colors.default.secondary;
        break;
      case "success":
        button.hover!.color = theme.colors.state.success.color;
        break;
      case "error":
        button.hover!.color = theme.colors.state.error.color;
        break;
      case "info":
        button.hover!.color = theme.colors.state.info.color;
        break;
      case "warning":
        button.hover!.color = theme.colors.state.warning.color;
    }
  }

  // Font weight prop
  if (_fontWeight) {
    button.fontWeight = _fontWeight;
    button.hover!.fontWeight = button.fontWeight;
  }

  let defaultCss = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};
    border: 1px solid ${button.borderColor};
    ${PgTheme.convertToCSS(button)};

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
        margin-right: 0.375rem;
      }
    }

    /* Right Icon */
    & > span.right-icon {
      display: flex;

      & > * {
        margin-left: 0.375rem;
      }
    }

    /* Loading */
    & > span.btn-spinner {
      transform: scale(0);
    }

    &.${ClassName.BUTTON_LOADING} > span.btn-spinner {
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

  if (fullWidth) {
    defaultCss = defaultCss.concat(css`
      width: 100%;
    `);
  }

  if (kind === "icon") {
    defaultCss = defaultCss.concat(css`
      height: fit-content;
      width: fit-content;

      & img,
      svg {
        width: 1rem;
        height: 1rem;
      }
    `);
  }

  return defaultCss;
};

export default Button;
