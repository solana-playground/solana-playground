import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import Checkbox from "../Checkbox";
import Link from "../Link";
import SearchBar from "../SearchBar";
import Text from "../Text";
import { Sad } from "../Icons";
import { GITHUB_URL } from "../../constants";
import {
  PgTheme,
  PgTutorial,
  TUTORIAL_CATEGORIES,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "../../utils/pg";

const SEARCH_QUERY = "search";
const FRAMEWORK_QUERY = "framework";
const LANGUAGE_QUERY = "language";
const LEVEL_QUERY = "level";
const CATEGORY_QUERY = "category";

export const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_QUERY) ?? "";
  const frameworks = searchParams.getAll(FRAMEWORK_QUERY);
  const languages = searchParams.getAll(LANGUAGE_QUERY);
  const levels = searchParams.getAll(LEVEL_QUERY);
  const categories = searchParams.getAll(CATEGORY_QUERY);

  const filteredTutorials = PgTutorial.tutorials.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      (!frameworks.length ||
        (t.framework && frameworks.includes(t.framework))) &&
      (!languages.length ||
        (t.languages &&
          languages.some((l) => t.languages?.includes(l as any)))) &&
      (!levels.length || levels.includes(t.level)) &&
      (!categories.length ||
        categories.some((c) => t.categories?.includes(c as any)))
    );
  });

  return (
    <Wrapper>
      <InnerWrapper>
        <TopSection>
          <Title>Learn</Title>
          <SearchBar
            placeholder="Search tutorials"
            value={search}
            onChange={(ev) => {
              const value = ev.target.value;
              if (!value) searchParams.delete(SEARCH_QUERY);
              else searchParams.set(SEARCH_QUERY, value);

              setSearchParams(searchParams, { replace: true });
            }}
          />
        </TopSection>

        <MainSection>
          <FiltersWrapper>
            <FilterSection query={LEVEL_QUERY} filters={TUTORIAL_LEVELS} />
            <FilterSection
              query={FRAMEWORK_QUERY}
              filters={TUTORIAL_FRAMEWORKS}
            />
            <FilterSection
              query={LANGUAGE_QUERY}
              filters={TUTORIAL_LANGUAGES}
            />
            <FilterSection
              query={CATEGORY_QUERY}
              filters={TUTORIAL_CATEGORIES}
            />
          </FiltersWrapper>

          <TutorialsWrapper>
            {filteredTutorials.length ? (
              filteredTutorials.map((t) => <TutorialCard key={t.name} {...t} />)
            ) : (
              <NoMatch />
            )}
          </TutorialsWrapper>
        </MainSection>

        <BottomSection>
          <Link href={`${GITHUB_URL}/tree/master/client/src/tutorials`}>
            Contribute
          </Link>
        </BottomSection>
      </InnerWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.default)};
  `}
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 2rem 2.5rem;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const Title = styled.h1``;

const MainSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.main.default)};
  `}
`;

const FiltersWrapper = styled.div`
  ${({ theme }) => css`
    width: 14.875rem;
    padding: 0.5rem;
    border-right: 1px solid ${theme.colors.default.border};
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.main.filters)};
  `}
`;

interface FilterSectionProps {
  query: string;
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
            label={filter}
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

const TutorialsWrapper = styled.div`
  ${({ theme }) => css`
    padding: 1.5rem;
    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.tutorials.default
    )};
  `}
`;

const NoMatch = () => (
  <NoMatchWrapper>
    <NoMatchText icon={<Sad />}>No match found</NoMatchText>
  </NoMatchWrapper>
);

const NoMatchWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NoMatchText = styled(Text)`
  width: 21rem;
  height: 5rem;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 5rem;
  max-height: 5rem;
`;
