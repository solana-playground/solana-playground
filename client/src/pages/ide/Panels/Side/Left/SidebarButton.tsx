import { ComponentPropsWithoutRef, FC } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../../components/Img";
import { ClassName } from "../../../../../constants";
import { PgTheme } from "../../../../../utils/pg";

interface SidebarButtonProps extends ComponentPropsWithoutRef<"div"> {
  src: string;
}

const SidebarButton: FC<SidebarButtonProps> = ({ src, ...props }) => (
  <IconWrapper {...props}>
    <Icon src={src} />
  </IconWrapper>
);

const IconWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.sidebar.left.button.default)};

    &.${ClassName.ACTIVE} {
      ${PgTheme.convertToCSS(theme.components.sidebar.left.button.selected)};
    }

    &.${ClassName.ACTIVE} img,
    &:hover:not(.${ClassName.ACTIVE}) img {
      filter: invert(1);
    }
  `}
`;

const Icon = styled(Img)`
  width: 2rem;
  height: 2rem;
  padding: 0.25rem;
  filter: invert(0.5);
`;

export default SidebarButton;
