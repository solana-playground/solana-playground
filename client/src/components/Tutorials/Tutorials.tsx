import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import Link from "../Link";
import { GITHUB_URL } from "../../constants";
import { PgTheme, PgTutorial } from "../../utils/pg";

export const Tutorials = () => (
  <Wrapper>
    <TutorialsOuterWrapper>
      <TopSection>
        <Title>Learn</Title>
      </TopSection>

      <TutorialsInsideWrapper>
        {PgTutorial.tutorials.map((t, i) => (
          <TutorialCard key={i} {...t} />
        ))}
      </TutorialsInsideWrapper>

      <BottomSection>
        <Link href={`${GITHUB_URL}/tree/master/client/src/tutorials`}>
          Contribute
        </Link>
      </BottomSection>
    </TutorialsOuterWrapper>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    overflow: auto;

    ${PgTheme.convertToCSS(theme.components.main.views.tutorials.default)};
  `}
`;

const TutorialsOuterWrapper = styled.div`
  padding: 2rem 3rem;
  height: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const Title = styled.h1``;

const TutorialsInsideWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin: 2rem 0;
  max-width: 64rem;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
