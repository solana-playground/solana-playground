import styled from "styled-components";

import { Skeleton } from "../../../../components/Loading";

const TutorialsSkeleton = () => (
  <Wrapper>
    <OngoingWrapper>
      <Heading>
        <Skeleton width="7rem" />
      </Heading>
      <Tutorial>
        <Skeleton height="2.625rem" />
      </Tutorial>
    </OngoingWrapper>

    <CompletedWrapper>
      <Heading>
        <Skeleton width="8rem" />
      </Heading>
      <Tutorial>
        <Skeleton height="2.625rem" />
      </Tutorial>
    </CompletedWrapper>
  </Wrapper>
);

const Wrapper = styled.div``;

const Heading = styled.div`
  padding: 1rem 0 0 1rem;
`;

const Tutorial = styled.div`
  margin: 1rem 1rem 0 1rem;
`;

const OngoingWrapper = styled.div`
  margin-top: 0.625rem;
`;

const CompletedWrapper = styled.div`
  margin-top: 1.125rem;
`;

export default TutorialsSkeleton;
