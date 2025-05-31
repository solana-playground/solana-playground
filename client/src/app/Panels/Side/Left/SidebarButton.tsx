import { ComponentPropsWithoutRef, FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../components/Img";
import Tooltip from "../../../../components/Tooltip";
import { PgTheme, PgView } from "../../../../utils/pg";

interface SidebarButtonProps extends ComponentPropsWithoutRef<"div"> {
  src: string;
  tooltipEl: ReactNode;
}

const SidebarButton: FC<SidebarButtonProps> = ({
  src,
  tooltipEl,
  ...props
}) => (
  <Tooltip element={tooltipEl} placement="right" arrow={{ size: 4 }}>
    <IconWrapper {...props}>
      <Icon src={src} />
    </IconWrapper>
  </Tooltip>
);

const IconWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.sidebar.left.button.default)};

    &.${PgView.classNames.ACTIVE} {
      ${PgTheme.convertToCSS(theme.views.sidebar.left.button.selected)};
    }

    &.${PgView.classNames.ACTIVE} img,
    &:hover:not(.${PgView.classNames.ACTIVE}) img {
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
