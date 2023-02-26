import { FC } from "react";
import styled, { css } from "styled-components";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";
import { MenuItemProps } from "./MenuItem";
import { ClassName } from "../../constants";

export type OptionalMenuProps = {
  items?: MenuItemProps[];
  fullWidth?: boolean;
  onShow?: () => void;
  onHide?: () => void;
};

type MenuProps =
  | ({
      kind: "context";
    } & ContextMenuProps)
  | ({
      kind: "dropdown";
    } & DropdownMenuProps);

const Menu: FC<MenuProps> = ({ kind, children, ...props }) => {
  let MenuEl;

  switch (kind) {
    case "context":
      MenuEl = ContextMenu;
      break;
    case "dropdown":
      MenuEl = DropdownMenu;
      break;
    default:
      throw new Error("Menu kind is not selected");
  }

  return (
    <Wrapper {...props}>
      <MenuEl {...props}>{children}</MenuEl>
    </Wrapper>
  );
};

const Wrapper = styled.div<OptionalMenuProps>`
  ${({ fullWidth }) => css`
    & .${ClassName.MENU_WRAPPER} {
      ${fullWidth && "width: 100%"};
    }
  `}
`;

export default Menu;
