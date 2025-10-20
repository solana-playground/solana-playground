import {
  ComponentPropsWithoutRef,
  forwardRef,
  MouseEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import styled, { css, CSSProperties } from "styled-components";

import { spinnerAnimation } from "../Loading";
import { PgTheme, ThemeColor } from "../../utils/pg";

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

type ButtonBg = Exclude<ThemeColor, "textPrimary" | "textSecondary">;

type ButtonColor = ThemeColor;

type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** Button kind */
  kind?: ButtonKind;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button should take the full width of the parent element */
  fullWidth?: boolean;
  /** Loading state */
  loading?:
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
    { disabled, loading, leftIcon, rightIcon, onClick, children, ...props },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(() => getIsLoading(loading));
    const [isDisabled, setIsDisabled] = useState(disabled);

    // Manage manual loading state
    useEffect(() => {
      const isLoading = getIsLoading(loading);
      if (isLoading !== undefined) setIsLoading(isLoading);
    }, [loading]);

    // Disable when manually set
    useEffect(() => {
      setIsDisabled(disabled);
    }, [disabled]);

    const handleOnClick = async (ev: MouseEvent<HTMLButtonElement>) => {
      const shouldSetIsDisabled = getIsLoading(loading) === undefined;
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
        disabled={isDisabled || isLoading}
        $loading={isLoading}
        onClick={handleOnClick}
        {...props}
      >
        <span className="btn-spinner" />
        {leftIcon && <span className="left-icon">{leftIcon}</span>}

        {isLoading
          ? typeof loading === "object"
            ? loading.text ?? children
            : children
          : children}

        {rightIcon && <span className="right-icon">{rightIcon}</span>}
      </StyledButton>
    );
  }
);

/** Get whether the button is currently in a loading state */
const getIsLoading = (loading: ButtonProps["loading"]) => {
  return typeof loading === "object" ? loading.state : loading;
};

const StyledButton = styled.button<ButtonProps & { $loading?: boolean }>`
  ${({
    theme,
    kind = "outline",
    size,
    fullWidth,
    bg,
    color,
    hoverColor,
    fontWeight,
    $loading,
  }) => {
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

    // Background prop
    if (bg) {
      switch (bg) {
        case "primary":
        case "secondary":
          button.bg = theme.colors.default[bg];
          break;
        case "success":
        case "error":
        case "info":
        case "warning":
          button.bg = theme.colors.state[bg].bg;
      }
    }

    // Color prop
    if (color) {
      const themeColor = PgTheme.getColor(color);
      switch (color) {
        case "textPrimary":
        case "textSecondary":
          button.color = themeColor;
          break;
        case "primary":
        case "secondary":
        case "success":
        case "error":
        case "info":
        case "warning":
          button.color = themeColor + theme.default.transparency.high;
          button.hover!.color = themeColor;
      }
    }

    // Hover color prop
    if (hoverColor) button.hover!.color = PgTheme.getColor(hoverColor);

    // Font weight prop
    if (fontWeight) {
      button.fontWeight = fontWeight;
      button.hover!.fontWeight = button.fontWeight;
    }

    return css`
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid ${button.borderColor};
      transition: all ${theme.default.transition.duration.medium}
        ${theme.default.transition.type};

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

        ${$loading &&
        css`
          transform: scale(1);
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
          border: 3px solid transparent;
          border-top-color: ${theme.colors.default.primary};
          border-right-color: ${theme.colors.default.primary};
          border-radius: 50%;
          animation: ${spinnerAnimation} 0.5s linear infinite;
        `}
      }

      ${PgTheme.convertToCSS(button)};

      ${fullWidth && `width: 100%;`}

      ${kind === "icon" &&
      `
      height: fit-content;
      width: fit-content;

      & img, svg {
        width: 1rem;
        height: 1rem;
      }
      `}
    `;
  }}
`;

export default Button;
