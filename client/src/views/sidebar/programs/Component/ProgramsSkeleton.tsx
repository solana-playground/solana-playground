import styled from "styled-components";

import { Skeleton } from "../../../../components/Loading";
import { PgFramework, TUTORIAL_CATEGORIES } from "../../../../utils";

const ProgramsSkeleton = () => (
  <Wrapper>
    <FilterGroup count={PgFramework.all.length} />
    <FilterGroup count={TUTORIAL_CATEGORIES.length} />
  </Wrapper>
);

const Wrapper = styled.div`
  margin: 1rem 0;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const FilterGroup = (props: { count: number }) => (
  <FilterGroupWrapper>
    <Skeleton height="1rem" width="7rem" />

    <FiltersWrapper>
      {Array.from({ length: props.count })
        .fill(null)
        .map((_, i) => (
          <FilterWrapper key={i}>
            <Skeleton height="0.875rem" width="0.875rem" />
            <Skeleton height="0.875rem" />
          </FilterWrapper>
        ))}
    </FiltersWrapper>
  </FilterGroupWrapper>
);

const FilterGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FiltersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
`;

const FilterWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 0.75rem;
`;

export default ProgramsSkeleton;
