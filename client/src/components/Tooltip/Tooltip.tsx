import { FC } from "react";
import styled, { css } from "styled-components";

import { ClassName } from "../../constants";

interface TooltipProps {
  text: string;
}

const Tooltip: FC<TooltipProps> = ({ text, children }) => (
  <StyledTooltip className={ClassName.TOOLTIP} text={text}>
    {children}
  </StyledTooltip>
);

const StyledTooltip = styled.div<TooltipProps>`
  ${({ text, theme }) => css`
    position: relative;
    height: fit-content;

    &::before,
    &::after {
      --scale: 0;
      --arrow-size: 0.5rem;

      position: absolute;
      top: -0.25rem;
      left: 50%;
      transform: translateX(-50%) translateY(var(--translate-y, 0))
        scale(var(--scale));
      transition: all ${theme.transition?.duration.medium}
        ${theme.transition?.type};
      transform-origin: bottom center;
    }

    &::before {
      --translate-y: calc(-100% - var(--arrow-size));

      content: "${text}";
      padding: 0.375rem 0.5rem;
      border-radius: ${theme.borderRadius};
      text-align: center;
      width: max-content;
      max-width: fit-content;
      color: ${text !== "Copied"
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
