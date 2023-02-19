import { FC, MouseEvent } from "react";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";
import { MenuItemProps } from "./MenuItem";

export type OptionalMenuProps = {
  items?: MenuItemProps[];
  cb?: (e: MouseEvent<HTMLDivElement>) => void;
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

  return <MenuEl {...props}>{children}</MenuEl>;
};

export default Menu;
