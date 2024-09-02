import { FC } from "react";
import styled, { css } from "styled-components";

import SearchBar from "../../../components/SearchBar";
import Text from "../../../components/Text";
import ProgramCard, { ProgramCardProps } from "./ProgramCard";
import { Sad } from "../../../components/Icons";
import { FILTERS } from "./filters";
import { useFilteredSearch } from "../../../hooks";
import { PgTheme } from "../../../utils/pg";

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
        {!regularItems.length && <NoMatch />}

        {regularItems.map((program) => (
          <ProgramCard key={program.name} {...program} />
        ))}
      </MainSection>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.programs.default)};
  `}
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
    ${PgTheme.convertToCSS(theme.components.main.views.programs.main.default)};
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
