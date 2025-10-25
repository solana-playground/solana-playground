import styled, { css } from "styled-components";

import FeaturedTutorial from "./FeaturedTutorial";
import TutorialCard from "./TutorialCard";
import SearchBar from "../../../../components/SearchBar";
import Text from "../../../../components/Text";
import Topbar from "../../../../components/Topbar";
import { FILTERS } from "./filters";
import { Sad } from "../../../../components/Icons";
import { useFilteredSearch } from "../../../../hooks";
import { PgTutorial, TUTORIAL_LEVELS } from "../../../../utils/pg";

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

      <MainSection>
        <ContentWrapper noMatch={!featuredItems.length && !regularItems.length}>
          {!featuredItems.length && !regularItems.length && (
            <NoMatchText icon={<Sad />}>No match found</NoMatchText>
          )}

          {featuredItems.length > 0 && (
            <FeaturedTutorial tutorial={featuredItems[0]} />
          )}

          {regularItems.length > 0 &&
            regularItems.map((t) => <TutorialCard key={t.name} {...t} />)}
        </ContentWrapper>
      </MainSection>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    --top-height: 4.5rem;

    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

const TopSection = styled(Topbar)`
  height: var(--top-height);
  padding: 1rem 2.5rem;
  z-index: 1;

  & > div {
    width: max(12rem, 50%);
  }
`;

const Title = styled.h1``;

const MainSection = styled.div`
  display: flex;
  min-height: calc(100% - var(--top-height));
  padding: 2rem 2.5rem;
`;

const ContentWrapper = styled.div<{ noMatch: boolean }>`
  ${({ noMatch }) => css`
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    gap: 1rem;

    ${noMatch
      ? "justify-content: center; align-items: center"
      : "height: fit-content"};
  `}
`;

const NoMatchText = styled(Text)`
  ${({ theme }) => css`
    width: 21rem;
    height: 5rem;
    font-size: ${theme.font.other.size.small};
  `}
`;

export default Tutorials;
