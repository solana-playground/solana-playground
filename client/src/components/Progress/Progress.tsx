import { FC } from "react";
import styled, { css } from "styled-components";

interface ProgressProps {
  value: number;
}

const Progress: FC<ProgressProps> = ({ value }) => {
  return (
    <Wrapper style={value ? {} : { visibility: "hidden" }}>
      <Indicator style={{ width: value.toString() + "%" }} />
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
  `}
`;

export default Progress;
