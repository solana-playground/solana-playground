import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";
import { MenuItemProps } from "./MenuItem";
import { ClassName } from "../../constants";
import { PgTheme } from "../../utils/pg";

export type MenuKind = MenuProps["kind"];

export type OptionalMenuProps = {
  items?: MenuItemProps[];
  onShow?: () => void;
  onHide?: () => void;
} & MenuWrapperProps;

type MenuWrapperProps = {
  fullWidth?: boolean;
};

type MenuProps =
  | ({
      kind: "context";
    } & ContextMenuProps)
  | ({
      kind: "dropdown";
    } & DropdownMenuProps);

const Menu: FC<MenuProps> = ({ kind, fullWidth, children, ...props }) => {
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
    <Wrapper kind={kind} fullWidth={fullWidth}>
      <MenuEl {...props}>{children}</MenuEl>
    </Wrapper>
  );
};

const Wrapper = styled.div<MenuWrapperProps & Pick<MenuProps, "kind">>`
  ${(props) => getStyles(props)}
`;

const getStyles = ({
  kind,
  fullWidth,
  theme,
}: MenuWrapperProps & Pick<MenuProps, "kind"> & { theme: DefaultTheme }) => {
  const menu = PgTheme.overrideDefaults(
    theme.components.menu.default,
    theme.components.menu.overrides?.[kind]
  );

  return css`
  & .${ClassName.MENU_WRAPPER} {
    ${PgTheme.convertToCSS(menu)};

    ${fullWidth && "width: 100%"};
`;
};

export default Menu;
