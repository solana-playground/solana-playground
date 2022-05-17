import { FC } from "react";
import styled, { css } from "styled-components";

interface TooltipProps {
  tooltipText: string;
}

const Tooltip: FC<TooltipProps> = ({ tooltipText, children }) => {
  return <StyledTooltip tooltipText={tooltipText}>{children}</StyledTooltip>;
};

const StyledTooltip = styled.div<TooltipProps>`
  ${({ tooltipText, theme }) => css`
    position: relative;

    &::before,
    &::after {
      --scale: 0;
      --arrow-size: 0.5rem;

      position: absolute;
      top: -0.25rem;
      left: 50%;
      transform: translateX(-50%) translateY(var(--translate-y, 0))
        scale(var(--scale));
      transition: 150ms transform;
      transform-origin: bottom center;
    }

    &::before {
      --translate-y: calc(-100% - var(--arrow-size));

      content: "${tooltipText}";
      padding: 0.375rem 0.5rem;
      border-radius: ${theme.borderRadius};
      text-align: center;
      width: max-content;
      max-width: 100%;
      color: ${tooltipText !== "Copied"
        ? theme.colors.tooltip?.color
        : theme.colors.state.success.color};
      background: ${theme.colors.tooltip?.bg};
      font-size: ${theme.font?.size.small};
    }

    &:hover::before,
    &:hover::after {
      --scale: 1;
    }

    &::after {
      --translate-y: calc(-1 * var(--arrow-size));

      content: "";
      border: var(--arrow-size) solid transparent;
      border-top-color: ${theme.colors.tooltip?.bg};
      transform-origin: top center;
    }
  `}
`;

export default Tooltip;
