import { ComponentPropsWithoutRef, forwardRef } from "react";
import styled, { css } from "styled-components";

import { PgTheme, ThemeColor } from "../../utils/pg";

export interface SvgProps extends ComponentPropsWithoutRef<"svg"> {
  color?: ThemeColor;
  rotate?: "90deg" | "180deg" | "270deg";
}

/** `<svg>` that works with `styled-components` and better defaults */
const Svg = forwardRef<SVGSVGElement, SvgProps>(
  ({ children, ...props }, ref) => (
    <StyledSvg
      ref={ref}
      xmlns="http://www.w3.org/2000/Svg"
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </StyledSvg>
  )
);

const StyledSvg = styled.svg<SvgProps>`
  ${({ color, rotate, theme }) => css`
    ${PgTheme.convertToCSS(theme.components.svg)};

    ${color && `color: ${PgTheme.getColor(color)}`};
    ${rotate && `rotate: ${rotate}`};
  `}
`;

export default Svg;
