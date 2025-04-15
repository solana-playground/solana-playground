import styled, { css } from "styled-components";

import FeaturedTutorial from "./FeaturedTutorial";
import TutorialCard from "./TutorialCard";
import FilterGroups from "../../../../components/FilterGroups";
import Link from "../../../../components/Link";
import SearchBar from "../../../../components/SearchBar";
import Text from "../../../../components/Text";
import { FILTERS } from "./filters";
import { Sad } from "../../../../components/Icons";
import { useFilteredSearch } from "../../../../hooks";
import { GITHUB_URL } from "../../../../constants";
import { PgTheme, PgTutorial, TUTORIAL_LEVELS } from "../../../../utils/pg";

const Tutorials = () => {
  const filteredSearch = useFilteredSearch({
    route: "/tutorials",
    items: PgTutorial.all,
    filters: FILTERS,
    sort: (a, b) => {
      // Prioritize "Hello world" tutorials
      if (a.name.startsWith("Hello") && b.name.startsWith("Hello")) {
        return a.name.localeCompare(b.name);
      }
      if (a.name.startsWith("Hello")) return -1;
      if (b.name.startsWith("Hello")) return 1;

      // If different level, sort by level (beginner to advanced)
      if (a.level !== b.level) {
        return (
          TUTORIAL_LEVELS.indexOf(a.level) - TUTORIAL_LEVELS.indexOf(b.level)
        );
      }

      // Same level, sort by creation date (newest to oldest)
      return b.unixTimestamp - a.unixTimestamp;
    },
  });
  if (!filteredSearch) return null;

  const { featuredItems, regularItems, searchBarProps } = filteredSearch;

  return (
    <Wrapper>
      <TopSection>
        <Title>Learn</Title>
        <SearchBar
          {...searchBarProps}
          placeholder="Search tutorials"
          searchButton={{ position: "right", width: "2.5rem" }}
        />
      </TopSection>

      <MainSectionScrollWrapper>
        <MainSection>
          <SideWrapper>
            <FiltersWrapper>
              <FilterGroups filters={FILTERS} items={PgTutorial.all} />
            </FiltersWrapper>
          </SideWrapper>

          <ContentWrapper>
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
          </ContentWrapper>
        </MainSection>
      </MainSectionScrollWrapper>

      <BottomSection>
        <Link href={`${GITHUB_URL}/tree/master/client/src/tutorials`}>
          Contribute
        </Link>
      </BottomSection>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorials.default)};
  `}
`;

const TopSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorials.top)};
  `}
`;

const Title = styled.h1``;

const MainSectionScrollWrapper = styled.div`
  margin: 2rem 2.5rem;
  overflow: hidden;
  flex-grow: 1;
`;

const MainSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorials.main.default)};
  `}
`;

const SideWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorials.main.side)};
  `}
`;

const FiltersWrapper = styled.div`
  position: sticky;
  top: 0;
`;

const ContentWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.views.main.primary.tutorials.main.content.default
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
  margin-bottom: 2rem;
`;

export default Tutorials;
