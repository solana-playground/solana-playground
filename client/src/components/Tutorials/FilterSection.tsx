import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import Checkbox from "../Checkbox";
import LangIcon from "../LangIcon";
import { Framework, Level } from "./TutorialCard";
import type { FilterQuery } from "./Tutorials"; // Type-only circular import
import type { TutorialData } from "../../utils/pg";

interface FilterSectionProps {
  query: FilterQuery;
  filters: readonly string[];
}

const FilterSection: FC<FilterSectionProps> = ({ query, filters }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParams = searchParams.getAll(query);

  return (
    <FilterSectionWrapper>
      <FilterSectionTitle>{query}</FilterSectionTitle>
      {(filters as string[])
        .sort((a, b) => a.localeCompare(b))
        .map((filter) => (
          <Checkbox
            key={filter}
            label={<FilterLabel query={query}>{filter}</FilterLabel>}
            checked={filterParams.includes(filter)}
            onChange={(ev) => {
              if (ev.target.checked) {
                searchParams.append(query, filter);
              } else {
                const otherParams = filterParams.filter((f) => f !== filter);
                searchParams.delete(query);
                for (const otherParam of otherParams) {
                  searchParams.append(query, otherParam);
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
  ${({ theme }) => css`
    padding: 1rem;

    & label {
      margin: 0.75rem 0;
      font-size: ${theme.font.other.size.medium};
    }
  `}
`;

const FilterSectionTitle = styled.div`
  ${({ theme }) => css`
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: ${theme.font.other.size.small};
  `}
`;

interface FilterLabelProps {
  query: FilterQuery;
  children: any;
}

const FilterLabel: FC<FilterLabelProps> = ({ query, ...props }) => {
  switch (query) {
    case "level":
      return <Level {...props} />;
    case "framework":
      return <FilterLabelFramework {...props} />;
    case "language":
      return <Language {...props} />;
    case "category":
      return <Category {...props} />;
  }
};

const FilterLabelFramework = styled(Framework)`
  padding: 0.25rem;
  background: none;
  box-shadow: none;
`;

type TutorialLanguage = NonNullable<TutorialData["languages"]>[number];

interface LanguageProps {
  children: TutorialLanguage;
}

const Language: FC<LanguageProps> = ({ children }) => {
  return (
    <LanguageWrapper>
      <LangIcon fileName={getLanguageExtension(children)} />
      {children}
    </LanguageWrapper>
  );
};

const LanguageWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.25rem;
    display: flex;
    align-items: center;
    font-size: ${theme.font.other.size.small};
    font-weight: bold;

    & *:first-child {
      margin-right: 0.375rem;
    }
  `}
`;

const getLanguageExtension = (lang: TutorialLanguage) => {
  switch (lang) {
    case "Python":
      return ".py";
    case "Rust":
      return ".rs";
    case "TypeScript":
      return ".ts";
  }
};

const Category = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.font.other.size.small};
    font-weight: bold;
  `}
`;

export default FilterSection;
