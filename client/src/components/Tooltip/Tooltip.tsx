import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Popover, { PopoverProps } from "../Popover";
import { QuestionMarkOutlined } from "../Icons";
import { PgTheme } from "../../utils/pg";

export type TooltipProps = Omit<PopoverProps, "showOnHover" | "popEl"> & {
  /** Tooltip element to show on hover */
  element: ReactNode;
  /** Whether to show it as a help tooltip */
  help?: boolean;
};

const Tooltip: FC<TooltipProps> = ({ children, element, help, ...props }) => (
  <StyledPopover {...props} popEl={element} showOnHover>
    {help ? <StyledQuestionMarkOutlined color="textSecondary" /> : children}
  </StyledPopover>
);

const StyledPopover = styled(Popover)<Pick<TooltipProps, "bgSecondary">>`
  ${({ bgSecondary, theme }) => css`
    ${PgTheme.convertToCSS(theme.components.tooltip)};
    background: ${bgSecondary
      ? theme.components.tooltip.bgSecondary
      : theme.components.tooltip.bg};
  `}
`;

const StyledQuestionMarkOutlined = styled(QuestionMarkOutlined)`
  &:hover {
    cursor: help;
    color: ${({ theme }) => theme.colors.default.textPrimary};
  }
`;

export default Tooltip;
