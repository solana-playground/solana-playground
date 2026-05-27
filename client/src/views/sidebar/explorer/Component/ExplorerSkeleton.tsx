import styled from "styled-components";

import { Skeleton } from "../../../../components/Loading";

const ExplorerSkeleton = () => (
  <Wrapper>
    <ProjectsRow>
      <Skeleton height="1.625rem" width="4.25rem" />
      <Skeleton height="1.625rem" width="12.25rem" />
    </ProjectsRow>

    <Distance distance="0.5rem" />
    <Skeleton height="1.875rem" />

    <Distance distance="0.5rem" />
    <Skeleton height="1.75rem" width="8.5rem" style={{ marginLeft: "auto" }} />

    <Distance distance="0.75rem" />
    <FolderSection>
      <Skeleton height="1.75rem" width="3.75rem" />
      <Skeleton height="1.75rem" width="4.125rem" />
      <Skeleton height="1.75rem" width="4.875rem" />
    </FolderSection>

    <Distance distance="0.25rem" />
    <Skeleton height="3.25rem" />

    <Distance distance="0.875rem" />
    <FolderSection>
      <Skeleton height="1.75rem" width="3.125rem" />
      <Skeleton height="1.75rem" width="3.875rem" />
      <Skeleton height="1.75rem" width="3.625rem" />
    </FolderSection>

    <Distance distance="0.25rem" />
    <Skeleton height="3.25rem" />
  </Wrapper>
);

const Wrapper = styled.div`
  margin: 1.5rem 0.5rem 0 0.5rem;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
`;

const Distance = styled.div<{ distance: string }>`
  ${({ distance }) => `
    margin-top: ${distance};
  `}
`;

const ProjectsRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const FolderSection = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export default ExplorerSkeleton;
