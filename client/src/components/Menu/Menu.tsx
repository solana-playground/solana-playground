import { FC, RefObject } from "react";
import styled from "styled-components";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";
import type { MenuItemProps } from "./MenuItem";
import type { Fn } from "../../utils/pg";

export type MenuKind = MenuProps["kind"];

export type OptionalMenuProps = {
  items?: MenuItemProps[];
  onShow?: Fn;
  onHide?: Fn;
};

type MenuProps = (
  | ({
      kind: "context";
    } & ContextMenuProps)
  | ({
      kind: "dropdown";
    } & DropdownMenuProps)
) & {
  menuRef?: RefObject<HTMLDivElement>;
};

const Menu: FC<MenuProps> = ({ kind, menuRef, children, ...props }) => {
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
    <Wrapper ref={menuRef}>
      <MenuEl {...props}>{children}</MenuEl>
    </Wrapper>
  );
};

const Wrapper = styled.div``;

export default Menu;
