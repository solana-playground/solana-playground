import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";
import { MenuItemProps } from "./MenuItem";
import { ClassName } from "../../constants";

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
  let menu = theme.components?.menu?.default;

  // Check for overrides
  if (theme.components?.menu?.overrides?.[kind]) {
    const overrides = theme.components.menu.overrides[kind];
    menu = { ...menu, ...overrides };
  }

  return css`
  & .${ClassName.MENU_WRAPPER} {
    ${fullWidth && "width: 100%"};

    background: ${menu?.bg};
    color: ${menu?.color};
    border-color: ${menu?.borderColor};
    border-radius: ${menu?.borderRadius};
    padding: ${menu?.padding};
    font-size: ${menu?.fontSize};
    font-weight: ${menu?.fontWeight};
    box-shadow: ${menu?.boxShadow};

    &:hover {
      ${menu?.hover?.bg && `background: ${menu.hover.bg}`};
      ${menu?.hover?.color && `color: ${menu.hover.color}`};
      ${menu?.hover?.borderColor && `border-color: ${menu.hover.borderColor}`};
      ${
        menu?.hover?.borderRadius && `border-radius: ${menu.hover.borderRadius}`
      };
      ${menu?.hover?.padding && `padding: ${menu.hover.padding}`};
      ${menu?.hover?.fontSize && `font-size: ${menu.hover.fontSize}`};
      ${menu?.hover?.fontWeight && `font-weight: ${menu.hover.fontWeight}`};
      ${menu?.hover?.boxShadow && `box-shadow: ${menu.hover.boxShadow}`};
    }
`;
};

export default Menu;
