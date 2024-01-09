import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled, { css, DefaultTheme } from "styled-components";

import FadeIn from "../FadeIn";
import { Fn, PgTheme } from "../../utils/pg";
import { useKeybind } from "../../hooks";
import type { MenuKind } from "./Menu";

interface MenuWrapperProps extends ComponentPropsWithoutRef<"div"> {
  hide: Fn;
  kind: MenuKind;
}

export const MenuWrapper = forwardRef<HTMLDivElement, MenuWrapperProps>(
  ({ hide, ...props }, ref) => {
    useKeybind("Escape", hide);

    return <Wrapper ref={ref} {...props} />;
  }
);

const Wrapper = styled(FadeIn)<Pick<MenuWrapperProps, "kind">>`
  ${(props) => getStyles(props)}
`;

const getStyles = ({
  kind,
  theme,
}: Pick<MenuWrapperProps, "kind"> & { theme: DefaultTheme }) => {
  const menu = PgTheme.overrideDefaults(
    theme.components.menu.default,
    theme.components.menu.overrides?.[kind]
  );

  return css`
    ${PgTheme.convertToCSS(menu)};
  `;
};
