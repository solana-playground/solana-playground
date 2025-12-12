import { FC } from "react";
import styled, { css } from "styled-components";

import List from "../../../../components/ResponsiveItems";
import SearchBar from "../../../../components/SearchBar";
import Text from "../../../../components/Text";
import Topbar from "../../../../components/Topbar";
import FeaturedTutorial from "./FeaturedTutorial";
import TutorialCard from "./TutorialCard";
import { Sad } from "../../../../components/Icons";
import { Filter, useFilteredSearch } from "../../../../hooks";
import { TutorialData, TUTORIAL_LEVELS } from "../../../../utils/pg";

interface TutorialsProps {
  tutorials: TutorialData[];
  filters: Filter[];
}

const Tutorials: FC<TutorialsProps> = ({ tutorials, filters }) => {
  const filteredSearch = useFilteredSearch({
    route: "/tutorials",
    items: tutorials,
    filters,
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

      <MainSection noMatch={!featuredItems.length && !regularItems.length}>
        {featuredItems.length || regularItems.length ? (
          <List minItemWidth="16rem" gap="1rem" maxItems={4}>
            {regularItems.map((t) => (
              <TutorialCard key={t.name} {...t} />
            ))}
          </List>
        ) : (
          <NoMatchText icon={<Sad />}>No match found</NoMatchText>
        )}

        {featuredItems.length > 0 && (
          <FeaturedTutorial tutorial={featuredItems[0]} />
        )}
      </MainSection>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

const TopSection = styled(Topbar)`
  height: 4.5rem;
  padding: 1rem 2.5rem;
  z-index: 1;

  & > div {
    width: max(12rem, 50%);
  }
`;

const Title = styled.h1``;

const MainSection = styled.div<{ noMatch: boolean }>`
  ${({ noMatch }) => css`
    flex: 1;
    display: flex;
    padding: 2rem 2.5rem;

    ${noMatch && "justify-content: center; align-items: center;"}
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
