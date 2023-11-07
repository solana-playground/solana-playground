import ContextMenu from "./ContextMenu";
import DropdownMenu from "./DropdownMenu";
import type { MenuItemProps } from "./MenuItem";
import type { Fn } from "../../utils/pg";

export type MenuKind = "context" | "dropdown";

export type CommonMenuProps = {
  items: MenuItemProps[];
  onShow?: Fn;
  onHide?: Fn;
};

const Menu = {
  Context: ContextMenu,
  Dropdown: DropdownMenu,
};

export default Menu;
