import { ComponentProps, FC } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import Checkbox from "../Checkbox";
import Tag from "../Tag";
import type { Arrayable } from "../../utils/pg";

interface FilterGroupsProps<P extends string> {
  filters: readonly {
    param: P;
    filters: readonly string[];
  }[];
  items?: Array<{ [K in P]?: Arrayable<string> }>;
}

const FilterGroups = <P extends string>({
  filters,
  items,
}: FilterGroupsProps<P>) => (
  <>
    {filters.map((f) => (
      <FilterGroup
        key={f.param}
        {...f}
        filters={f.filters.map((name) => ({
          name,
          count: items?.filter((item) => {
            const field = item[f.param];
            if (typeof field === "string") return field === name;
            if (Array.isArray(field)) return field.includes(name);
            return false;
          }).length,
        }))}
      />
    ))}
  </>
);

interface FilterGroupProps {
  param: string;
  filters: Array<{ name: string } & Pick<FilterLabelProps, "count">>;
}

const FilterGroup: FC<FilterGroupProps> = ({ param, filters }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchValues = searchParams.getAll(param);

  return (
    <FilterGroupWrapper>
      <FilterGroupTitle>{param}</FilterGroupTitle>
      {filters
        .filter(Boolean)
        .filter((filter) => filter.count !== 0)
        .map((filter) => (
          <Checkbox
            key={filter.name}
            label={
              <FilterLabel
                kind={param}
                value={filter.name}
                count={filter.count}
              />
            }
            checked={searchValues.includes(filter.name)}
            onChange={(ev) => {
              if (ev.target.checked) {
                searchParams.append(param, filter.name);
              } else {
                const otherValues = searchValues.filter(
                  (f) => f !== filter.name
                );
                searchParams.delete(param);
                for (const otherValue of otherValues) {
                  searchParams.append(param, otherValue);
                }
              }

              setSearchParams(searchParams, { replace: true });
            }}
          />
        ))}
    </FilterGroupWrapper>
  );
};

const FilterGroupWrapper = styled.div`
  padding: 1rem;

  & label {
    margin: 0.5rem 0;
    padding: 0.25rem;
  }
`;

const FilterGroupTitle = styled.div`
  ${({ theme }) => css`
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: ${theme.font.other.size.small};
  `}
`;

type FilterLabelProps = ComponentProps<typeof Tag> & {
  count: number | undefined;
};

const FilterLabel: FC<FilterLabelProps> = ({ count, ...props }) => (
  <FilterLabelWrapper>
    <StyledTag {...props} />
    {count ? <FilterCount>({count})</FilterCount> : null}
  </FilterLabelWrapper>
);

const FilterLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.125rem;
`;

const StyledTag = styled(Tag)`
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

const FilterCount = styled.span`
  font-weight: bold;
`;

export default FilterGroups;
