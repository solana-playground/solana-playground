import { URLSearchParamsInit, useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import Link from "../Link";
import SearchBar from "../SearchBar";
import Text from "../Text";
import { Sad } from "../Icons";
import { GITHUB_URL } from "../../constants";
import { PgTheme, PgTutorial } from "../../utils/pg";

const SEARCH_QUERY = "search";

export const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_QUERY) ?? "";

  const filteredTutorials = PgTutorial.tutorials.filter((t) => {
    return t.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Wrapper>
      <TutorialsOuterWrapper>
        <TopSection>
          <Title>Learn</Title>
          <SearchBar
            placeholder="Search tutorials"
            value={search}
            onChange={(ev) => {
              const hasNoQuery =
                [...searchParams.entries()]
                  .filter(([param]) => param !== SEARCH_QUERY)
                  .every(([_, value]) => !value) && !ev.target.value;
              const params: URLSearchParamsInit = hasNoQuery
                ? {}
                : { [SEARCH_QUERY]: ev.target.value };
              setSearchParams(params, { replace: true });
            }}
          />
        </TopSection>

        <TutorialsInsideWrapper>
          {filteredTutorials.length ? (
            filteredTutorials.map((t) => <TutorialCard key={t.name} {...t} />)
          ) : (
            <NoMatch />
          )}
        </TutorialsInsideWrapper>

        <BottomSection>
          <Link href={`${GITHUB_URL}/tree/master/client/src/tutorials`}>
            Contribute
          </Link>
        </BottomSection>
      </TutorialsOuterWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.default)};
  `}
`;

const TutorialsOuterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 2rem 3rem;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const Title = styled.h1``;

const TutorialsInsideWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.main.default)};
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

const NoMatch = () => (
  <NoMatchWrapper>
    <NoMatchText delay={5} icon={<Sad />}>
      No match found
    </NoMatchText>
  </NoMatchWrapper>
);

const NoMatchWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NoMatchText = styled(Text)`
  width: 21rem;
  height: 5rem;
`;
