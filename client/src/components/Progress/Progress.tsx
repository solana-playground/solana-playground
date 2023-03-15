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
        ? theme.colors.default.borderColor
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
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    width: 100%;
    height: 0.75rem;
    overflow: hidden;
  `}
`;

const Indicator = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.primary};
    border-radius: ${theme.borderRadius};
    height: 100%;
    transition: width ${theme.transition.duration.long} ${theme.transition.type};
  `}
`;

export default Progress;
