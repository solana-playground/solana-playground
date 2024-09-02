import styled, { css } from "styled-components";

import FeaturedTutorial from "./FeaturedTutorial";
import TutorialCard from "./TutorialCard";
import FilterGroup from "../../../components/FilterGroup";
import Link from "../../../components/Link";
import SearchBar from "../../../components/SearchBar";
import Text from "../../../components/Text";
import { FILTERS, sortByLevel } from "./filters";
import { Sad } from "../../../components/Icons";
import { useFilteredSearch } from "../../../hooks";
import { GITHUB_URL } from "../../../constants";
import { PgTheme, PgTutorial } from "../../../utils/pg";

/**
 * Tutorial items sorted by date.
 *
 * The first 3 tutorials are kept in order because they are essential "Hello
 * world" tutorials. The remaining tutorials are sorted from the newest to the
 * oldest.
 */
const tutorials = [
  ...PgTutorial.tutorials.slice(0, 3),
  ...PgTutorial.tutorials.slice(3).sort(() => -1),
];

export const Tutorials = () => {
  const filteredSearch = useFilteredSearch({
    route: "/tutorials",
    items: tutorials,
    filters: FILTERS,
    sort: sortByLevel,
  });
  if (!filteredSearch) return null;

  const { featuredItems, regularItems, searchBarProps } = filteredSearch;

  return (
    <Wrapper>
      <InnerWrapper>
        <TopSection>
          <Title>Learn</Title>
          <SearchBar
            {...searchBarProps}
            placeholder="Search tutorials"
            searchButton={{ position: "right", width: "2.5rem" }}
          />
        </TopSection>

        <MainSection>
          <FiltersWrapper>
            {FILTERS.map((f) => (
              <FilterGroup key={f.param} {...f} />
            ))}
          </FiltersWrapper>

          <TutorialsWrapper>
            {!featuredItems.length && !regularItems.length && <NoMatch />}

            {featuredItems.length > 0 && (
              <FeaturedTutorial tutorial={featuredItems[0]} />
            )}

            {regularItems.length > 0 && (
              <RegularTutorialsWrapper>
                {regularItems.map((t) => (
                  <TutorialCard key={t.name} {...t} />
                ))}
              </RegularTutorialsWrapper>
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

  /** Search bar */
  & > div {
    width: max(12rem, 50%);
  }
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

const RegularTutorialsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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
