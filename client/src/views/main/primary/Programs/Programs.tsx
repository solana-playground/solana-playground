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

export const Programs: FC<ProgramsProps> = ({ programs }) => {
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
    ${PgTheme.convertToCSS(theme.components.main.primary.programs.default)};
  `}
`;

const TopSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.programs.top)};
  `}
`;

const Title = styled.h1``;

const MainSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.programs.main.default
    )};
  `}
`;

const MainContent = styled.div<{ noMatch: boolean }>`
  ${({ theme, noMatch }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.programs.main.content.default
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
