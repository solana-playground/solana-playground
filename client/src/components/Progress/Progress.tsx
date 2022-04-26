import { FC } from "react";
import styled, { css } from "styled-components";

interface ProgressProps {
  value: number;
}

const Progress: FC<ProgressProps> = ({ value }) => {
  return (
    <Wrapper style={value ? {} : { visibility: "hidden" }}>
      <Indicator value={value} />
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

const Indicator = styled.div<ProgressProps>`
  ${({ theme, value }) => css`
    background-color: ${theme.colors.default.primary};
    border-radius: ${theme.borderRadius};
    width: ${value}%;
    height: 100%;
  `}
`;

export default Progress;
