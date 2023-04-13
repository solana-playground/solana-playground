import { FC, useEffect, useRef } from "react";
import styled, { css, useTheme } from "styled-components";

interface ProgressProps {
  value: number;
}

const Progress: FC<ProgressProps> = ({ value }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Hide progress bar when value is falsy value but still allow the animation
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.borderColor = value
        ? theme.colors.default.border
        : "transparent";
    }
  }, [value, theme]);

  return (
    <Wrapper ref={wrapperRef}>
      <Indicator style={{ width: `${value.toString()}%` }} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    border: 1px solid ${theme.colors.default.border};
    border-radius: ${theme.default.borderRadius};
    width: 100%;
    height: 0.75rem;
    overflow: hidden;
  `}
`;

const Indicator = styled.div`
  ${({ theme }) => css`
    background: ${theme.colors.default.primary};
    border-radius: ${theme.default.borderRadius};
    height: 100%;
    transition: width ${theme.default.transition.duration.long}
      ${theme.default.transition.type};
  `}
`;

export default Progress;
