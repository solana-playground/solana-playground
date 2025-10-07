import { FC } from "react";
import styled, { css } from "styled-components";

import SearchBar from "../../../../components/SearchBar";
import Text from "../../../../components/Text";
import ProgramCard, { ProgramCardProps } from "./ProgramCard";
import { FILTERS } from "./filters";
import { Sad } from "../../../../components/Icons";
import { useFilteredSearch } from "../../../../hooks";
import { PgTheme } from "../../../../utils/pg";

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

    ${PgTheme.convertToCSS(theme.views.main.primary.programs.default)};
  `}
`;

const TopSection = styled.div`
  ${({ theme }) => css`
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: var(--top-height);
    padding: 1rem 2.5rem;
    background: ${PgTheme.getDifferentBackground(
      theme.views.main.primary.programs.default.bg
    )};
    border-bottom: 1px solid ${theme.colors.default.border};

    & > div {
      width: max(12rem, 50%);
    }

    ${PgTheme.convertToCSS(theme.views.main.primary.programs.top)};
  `}
`;

const Title = styled.h1``;

const MainSection = styled.div`
  ${({ theme }) => css`
    display: flex;
    min-height: calc(100% - var(--top-height));
    padding: 2rem 2.5rem;

    ${PgTheme.convertToCSS(theme.views.main.primary.programs.main.default)};
  `}
`;

const MainContent = styled.div<{ noMatch: boolean }>`
  ${({ theme, noMatch }) => css`
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    gap: 1.5rem;

    ${PgTheme.convertToCSS(
      theme.views.main.primary.programs.main.content.default
    )};

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
