import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import FilterSection from "./FilterSection";
import TutorialCard from "./TutorialCard";
import Link from "../Link";
import SearchBar from "../SearchBar";
import Text from "../Text";
import { filterQuery, FILTERS, sortByLevel } from "./filters";
import { Sad } from "../Icons";
import { GITHUB_URL } from "../../constants";
import { PgTheme, PgTutorial } from "../../utils/pg";

const SEARCH_PARAM = "search";

export const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM) ?? "";

  const filters = FILTERS.map((f: { param: string; tutorialKey?: string }) => ({
    key: (f.tutorialKey ?? f.param) as "level",
    value: searchParams.getAll(f.param),
  }));

  const filteredTutorials = PgTutorial.tutorials
    .filter((t) => {
      return (
        t.name.toLowerCase().includes(search.toLowerCase()) &&
        filters.every((f) => filterQuery(f.value, t[f.key]))
      );
    })
    .sort((a, b) => sortByLevel(a.level, b.level));

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
              if (!value) searchParams.delete(SEARCH_PARAM);
              else searchParams.set(SEARCH_PARAM, value);

              setSearchParams(searchParams, { replace: true });
            }}
          />
        </TopSection>

        <MainSection>
          <FiltersWrapper>
            {FILTERS.map((f) => (
              <FilterSection key={f.param} {...f} />
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
