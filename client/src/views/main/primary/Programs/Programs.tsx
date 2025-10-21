import { FC } from "react";
import styled, { css } from "styled-components";

import SearchBar from "../../../../components/SearchBar";
import Text from "../../../../components/Text";
import Topbar from "../../../../components/Topbar";
import ProgramCard, { ProgramCardProps } from "./ProgramCard";
import { FILTERS } from "./filters";
import { Sad } from "../../../../components/Icons";
import { useFilteredSearch } from "../../../../hooks";

interface ProgramsProps {
  programs: ProgramCardProps[];
}

const Programs: FC<ProgramsProps> = ({ programs }) => {
  const filteredSearch = useFilteredSearch({
    route: "/programs",
    items: programs,
    filters: FILTERS,
    sort: (a, b) => a.name.localeCompare(b.name),
  });
  if (!filteredSearch) return null;

  const { regularItems, searchBarProps } = filteredSearch;

  return (
    <Wrapper>
      <TopSection>
        <Title>Programs</Title>
        <SearchBar
          {...searchBarProps}
          placeholder="Search programs"
          searchButton={{ position: "right", width: "2.5rem" }}
        />
      </TopSection>

      <MainSection>
        <MainContent noMatch={!regularItems.length}>
          {!regularItems.length && (
            <NoMatchText icon={<Sad />}>No match found</NoMatchText>
          )}

          {regularItems.map((program) => (
            <ProgramCard key={program.name} {...program} />
          ))}
        </MainContent>
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
  ${({ theme }) => css`
    height: var(--top-height);
    padding: 1rem 2.5rem;

    & > div {
      width: max(12rem, 50%);
    }
  `}
`;

const Title = styled.h1``;

const MainSection = styled.div`
  ${({ theme }) => css`
    display: flex;
    min-height: calc(100% - var(--top-height));
    padding: 2rem 2.5rem;
  `}
`;

const MainContent = styled.div<{ noMatch: boolean }>`
  ${({ theme, noMatch }) => css`
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    gap: 1.5rem;

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

export default Programs;
