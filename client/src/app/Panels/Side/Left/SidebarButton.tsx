import { ComponentPropsWithoutRef, FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../components/Img";
import Tooltip from "../../../../components/Tooltip";
import { PgTheme } from "../../../../utils/pg";

interface SidebarButtonProps extends ComponentPropsWithoutRef<"div"> {
  src: string;
  tooltip: ReactNode;
  active?: boolean;
}

const SidebarButton: FC<SidebarButtonProps> = ({ src, tooltip, ...props }) => (
  <Tooltip element={tooltip} placement="right" arrow={{ size: 4 }}>
    <IconWrapper {...props}>
      <Icon src={src} />
    </IconWrapper>
  </Tooltip>
);

const IconWrapper = styled.div<Pick<SidebarButtonProps, "active">>`
  ${({ theme, active }) => css`
    ${PgTheme.convertToCSS(theme.views.sidebar.left.button.default)};

    ${active
      ? `${PgTheme.convertToCSS(theme.views.sidebar.left.button.selected)};
      & img { filter: invert(1); }`
      : `&:hover img { filter: invert(1); }`}
  `}
`;

const Icon = styled(Img)`
  width: 2rem;
  height: 2rem;
  padding: 0.25rem;
  filter: invert(0.5);
`;

export default SidebarButton;
