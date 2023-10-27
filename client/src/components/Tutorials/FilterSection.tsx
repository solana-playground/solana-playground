import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import Checkbox from "../Checkbox";
import TutorialDetail from "../Tutorial/TutorialDetail";
import type { TutorialDetailKey } from "../../utils/pg";

interface FilterSectionProps {
  param: TutorialDetailKey;
  filters: readonly string[];
  sortFn?: (a: string, b: string) => number;
}

const FilterSection: FC<FilterSectionProps> = ({ param, filters, sortFn }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchValues = searchParams.getAll(param);

  return (
    <FilterSectionWrapper>
      <FilterSectionTitle>{param}</FilterSectionTitle>
      {filters
        .filter(Boolean)
        .sort(sortFn)
        .map((filter) => (
          <Checkbox
            key={filter}
            label={<FilterLabel kind={param}>{filter}</FilterLabel>}
            checked={searchValues.includes(filter)}
            onChange={(ev) => {
              if (ev.target.checked) {
                searchParams.append(param, filter);
              } else {
                const otherValues = searchValues.filter((f) => f !== filter);
                searchParams.delete(param);
                for (const otherValue of otherValues) {
                  searchParams.append(param, otherValue);
                }
              }

              setSearchParams(searchParams, { replace: true });
            }}
          />
        ))}
    </FilterSectionWrapper>
  );
};

const FilterSectionWrapper = styled.div`
  padding: 1rem;

  & label {
    margin: 0.5rem 0;
    padding: 0.25rem;
  }
`;

const FilterSectionTitle = styled.div`
  ${({ theme }) => css`
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: ${theme.font.other.size.small};
  `}
`;

const FilterLabel = styled(TutorialDetail)`
  ${({ kind }) => {
    // Reset the default box styles except `level`
    if (kind !== "level") {
      return css`
        padding: 0 0.25rem;
        background: none !important;
        box-shadow: none;
      `;
    }
  }}
`;

export default FilterSection;
