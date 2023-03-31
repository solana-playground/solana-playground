import { FC } from "react";
import styled, { css } from "styled-components";

import { ClassName } from "../../constants";
import { QuestionMarkOutlined } from "../Icons";
import { PgThemeManager } from "../../utils/pg/theme";

interface TooltipProps {
  text: string;
  maxWidth?: string;
  bgSecondary?: boolean;
  className?: string;
}

const Tooltip: FC<TooltipProps> = ({ className, children, ...props }) => (
  <StyledTooltip className={`${ClassName.TOOLTIP} ${className}`} {...props}>
    {children}
  </StyledTooltip>
);

const StyledTooltip = styled.div<TooltipProps>`
  ${({ text, maxWidth, bgSecondary, theme }) => css`
    position: relative;
    height: fit-content;
    width: fit-content;

    &::before,
    &::after {
      --scale: 0;
      --arrow-size: 0.5rem;
      --bg: ${bgSecondary
        ? theme.components.tooltip.bgSecondary
        : theme.components.tooltip.bg};

      position: absolute;
      top: -0.25rem;
      left: 50%;
      transform: translateX(-50%) translateY(var(--translate-y, 0))
        scale(var(--scale));
      transition: all ${theme.transition.duration.medium}
        ${theme.transition.type};
      transform-origin: bottom center;
    }

    &::before {
      --translate-y: calc(-100% - var(--arrow-size));

      content: "${text}";
      padding: 0.375rem 0.5rem;
      text-align: center;
      width: max-content;
      max-width: ${maxWidth ?? "fit-content"};
      ${PgThemeManager.convertToCSS(theme.components.tooltip)};
      background: var(--bg);
      color: ${text !== "Copied"
        ? theme.components.tooltip.color
        : theme.colors.state.success.color};
    }

    &::after {
      --translate-y: calc(-1 * var(--arrow-size));

      content: "";
      border: var(--arrow-size) solid transparent;
      border-top-color: var(--bg);
      transform-origin: top center;
    }

    &:hover::before,
    &:hover::after {
      --scale: 1;
    }
  `}
`;

export const HelpTooltip: FC<TooltipProps> = (props) => (
  <StyledQuestionTooltip {...props}>
    <QuestionMarkOutlined />
  </StyledQuestionTooltip>
);

const StyledQuestionTooltip = styled(Tooltip)`
  &:hover {
    & > svg {
      color: ${({ theme }) => theme.colors.default.textPrimary};
    }
  }
`;

export default Tooltip;
