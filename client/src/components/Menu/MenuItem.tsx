import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import { PgTheme, ThemeColor } from "../../utils/pg";

export interface MenuItemProps {
  name: string;
  onClick: () => void;
  keybind?: string;
  color?: ThemeColor;
  hoverColor?: ThemeColor;
  icon?: ReactNode;
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
  icon,
  showCondition = true,
  className,
}) => {
  if (!showCondition) return null;

  const handleClick = () => {
    onClick();
    hide?.();
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      onContextMenu={(ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        handleClick();
      }}
    >
      <div>
        {icon && icon}
        <span className={ItemClassName.NAME}>{name}</span>
      </div>
      {keybind && <span className={ItemClassName.KEYBIND}>{keybind}</span>}
    </div>
  );
};

const StyledItem = styled(MenuItem)`
  ${({ theme, color, hoverColor }) => css`
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: ${theme.font.code.size.small};
    color: ${PgTheme.getColor(color)};
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
      --color: ${PgTheme.getColor(hoverColor ?? "primary")};

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

export default StyledItem;
