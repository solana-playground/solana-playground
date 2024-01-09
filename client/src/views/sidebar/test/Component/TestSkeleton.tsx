import styled, { css } from "styled-components";

import { Skeleton } from "../../../../components/Loading";

const TestSkeleton = () => (
  <Wrapper>
    <ProgramNameWrapper>
      <Skeleton width="4rem" />
      <Skeleton width="6rem" />
    </ProgramNameWrapper>

    <Heading>
      <Skeleton width="6.5rem" />
    </Heading>

    <FullWidthBg>
      <Skeleton width="7.5rem" />
    </FullWidthBg>

    <Heading>
      <Skeleton width="4.5rem" />
    </Heading>

    <FullWidthBg>
      <Skeleton width="8rem" />
    </FullWidthBg>
  </Wrapper>
);

const Wrapper = styled.div``;

const ProgramNameWrapper = styled.div`
  display: flex;
  padding: 1rem 1rem 0 1rem;

  & > :first-child {
    margin-right: 0.75rem;
  }
`;

const Heading = styled.div`
  padding: 1.5rem 0 0 1rem;
`;

const FullWidthBg = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    margin-top: 0.75rem;
    background: ${theme.components.sidebar.right.default.otherBg};
    border-top: 1px solid ${theme.colors.default.border};
    border-bottom: 1px solid ${theme.colors.default.border};
  `}
`;

export default TestSkeleton;
