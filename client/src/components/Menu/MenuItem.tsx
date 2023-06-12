import { FC, ReactNode } from "react";
import styled, { css, DefaultTheme } from "styled-components";

export interface MenuItemProps {
  name: string;
  onClick: () => void;
  keybind?: string;
  Icon?: ReactNode;
  kind?:
    | keyof Pick<
        DefaultTheme["colors"]["default"],
        "primary" | "secondary" | "textPrimary"
      >
    | keyof Omit<DefaultTheme["colors"]["state"], "hover" | "disabled">;
  showCondition?: boolean;
  className?: string;
}

enum ItemClassName {
  NAME = "item-name",
  KEYBIND = "item-keybind",
}

type MenuItemPropsWithHide = {
  hide: () => void;
} & MenuItemProps;

const MenuItem: FC<MenuItemPropsWithHide> = ({
  name,
  onClick,
  hide,
  keybind,
  Icon,
  showCondition = true,
  className,
}) => {
  if (!showCondition) return null;

  return (
    <div
      className={className}
      onClick={() => {
        onClick();
        hide?.();
      }}
    >
      <div>
        {Icon && Icon}
        <span className={ItemClassName.NAME}>{name}</span>
      </div>
      {keybind && <span className={ItemClassName.KEYBIND}>{keybind}</span>}
    </div>
  );
};

const StyledItem = styled(MenuItem)`
  ${({ theme, kind }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
    border-left: 2px solid transparent;
    transition: all ${theme.default.transition.duration.short}
      ${theme.default.transition.type};

    & > div {
      display: flex;
      align-items: center;
      min-width: max-content;
    }

    & svg {
      margin-right: 0.5rem;
    }

    & img {
      margin-right: 0.5rem;
      width: 1rem;
      height: 1rem;
    }

    & span.${ItemClassName.KEYBIND} {
      font-weight: normal;
      margin-left: 1.5rem;
    }

    &:hover {
      --color: ${getHoverColor(kind, theme)};

      cursor: pointer;
      background: ${theme.colors.state.hover.bg};
      border-left-color: var(--color);

      & svg {
        color: var(--color);
      }

      & span.${ItemClassName.NAME} {
        color: var(--color);
        transition: all ${theme.default.transition.duration.short}
          ${theme.default.transition.type};
      }
    }
  `}
`;

const getHoverColor = (kind: MenuItemProps["kind"], theme: DefaultTheme) => {
  switch (kind) {
    case "primary":
      return theme.colors.default.primary;
    case "secondary":
      return theme.colors.default.secondary;
    case "error":
      return theme.colors.state.error.color;
    case "success":
      return theme.colors.state.success.color;
    case "warning":
      return theme.colors.state.warning.color;
    case "info":
      return theme.colors.state.info.color;
    case "textPrimary":
      return theme.colors.default.textPrimary;
    default:
      return theme.colors.default.primary;
  }
};

export default StyledItem;
