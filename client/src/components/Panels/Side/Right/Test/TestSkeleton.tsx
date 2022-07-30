import styled, { css } from "styled-components";
import { Skeleton } from "../../../../Loading";

const TestSkeleton = () => (
  <Wrapper>
    <ProgramNameWrapper>
      <Skeleton width="4rem" />
      <Skeleton width="6rem" />
    </ProgramNameWrapper>
    <Heading>
      <Skeleton width="6rem" />
    </Heading>
    <FullWidthBg>
      <Skeleton width="7rem" />
    </FullWidthBg>
    <Heading>
      <Skeleton width="5rem" />
    </Heading>
    <FullWidthBg>
      <Skeleton width="9rem" />
    </FullWidthBg>
  </Wrapper>
);

const Wrapper = styled.div``;

const ProgramNameWrapper = styled.div`
  display: flex;
  padding: 1rem;

  & > :first-child {
    margin-right: 1rem;
  }
`;

const Heading = styled.div`
  padding: 1rem 0 0 1rem;
`;

const FullWidthBg = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    padding: 1rem;
    margin: 0.75rem 0;
    border-top: 1px solid ${theme.colors.default.borderColor};
    border-bottom: 1px solid ${theme.colors.default.borderColor};
  `}
`;

export default TestSkeleton;
