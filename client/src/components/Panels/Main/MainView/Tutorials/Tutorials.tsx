import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import { TUTORIALS } from "../../../../../tutorials";

const Tutorials = () => (
  <Wrapper>
    <TutorialsOuterWrapper>
      <TopSection>
        <Title>Learn</Title>
      </TopSection>
      <TutorialsInsideWrapper>
        {TUTORIALS.map((t, i) => (
          <TutorialCard key={i} {...t} />
        ))}
      </TutorialsInsideWrapper>
    </TutorialsOuterWrapper>
  </Wrapper>
);

const TopSection = styled.div``;

const Title = styled.h1``;

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.tutorials?.bg};
    color: ${theme.colors.tutorials?.color};
    font-family: ${theme.font?.other?.family};
    font-size: ${theme.font?.other?.size.medium};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      width: 0.5rem;
      height: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const TutorialsOuterWrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
  padding: 2rem;
`;

const TutorialsInsideWrapper = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
`;

export default Tutorials;
