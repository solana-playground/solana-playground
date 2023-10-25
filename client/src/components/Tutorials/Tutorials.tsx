import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import FilterSection from "./FilterSection";
import TutorialCard from "./TutorialCard";
import Link from "../Link";
import SearchBar from "../SearchBar";
import Text from "../Text";
import { Sad } from "../Icons";
import { GITHUB_URL } from "../../constants";
import {
  Arrayable,
  PgCommon,
  PgTheme,
  PgTutorial,
  TUTORIAL_CATEGORIES,
  TUTORIAL_FRAMEWORKS,
  TUTORIAL_LANGUAGES,
  TUTORIAL_LEVELS,
} from "../../utils/pg";

const SEARCH_QUERY = "search";
const LEVEL_QUERY = "level";
const FRAMEWORK_QUERY = "framework";
const LANGUAGE_QUERY = "language";
const CATEGORY_QUERY = "category";

const FILTERS = [
  { query: LEVEL_QUERY, filters: TUTORIAL_LEVELS },
  { query: FRAMEWORK_QUERY, filters: TUTORIAL_FRAMEWORKS },
  { query: LANGUAGE_QUERY, filters: TUTORIAL_LANGUAGES },
  { query: CATEGORY_QUERY, filters: TUTORIAL_CATEGORIES },
] as const;

export type FilterQuery = typeof FILTERS[number]["query"];

const filterQuery = (
  queries: Arrayable<string>,
  values: Arrayable<string> = []
) => {
  queries = PgCommon.toArray(queries);
  values = PgCommon.toArray(values);
  return (
    !queries.length ||
    (values.length && queries.some((l) => values.includes(l as any)))
  );
};

export const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_QUERY) ?? "";
  const levels = searchParams.getAll(LEVEL_QUERY);
  const frameworks = searchParams.getAll(FRAMEWORK_QUERY);
  const languages = searchParams.getAll(LANGUAGE_QUERY);
  const categories = searchParams.getAll(CATEGORY_QUERY);

  const filteredTutorials = PgTutorial.tutorials.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      filterQuery(levels, t.level) &&
      filterQuery(frameworks, t.framework) &&
      filterQuery(languages, t.languages) &&
      filterQuery(categories, t.categories)
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
            {FILTERS.map((f) => (
              <FilterSection key={f.query} {...f} />
            ))}
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
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.main.filters)};
  `}
`;

const TutorialsWrapper = styled.div`
  ${({ theme }) => css`
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
  ${({ theme }) => css`
    width: 21rem;
    height: 5rem;
    font-size: ${theme.font.other.size.small};
  `}
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 5rem;
  max-height: 5rem;
`;
