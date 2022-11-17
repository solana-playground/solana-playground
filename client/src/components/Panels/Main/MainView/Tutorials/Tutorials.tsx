import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import { TUTORIALS } from "../../../../../tutorials";

const Tutorials = () => {
  const insideWrapperRef = useRef<HTMLDivElement>(null);

  // Make tutorials container responsive with ResizeObserver
  useEffect(() => {
    if (!insideWrapperRef.current) return;
    const el = insideWrapperRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const style = (entry.target as HTMLDivElement).style;
      const width = entry.contentRect.width;
      let amountInRow;
      if (width > 1080) {
        amountInRow = 3;
      } else if (width > 666) {
        amountInRow = 2;
      } else {
        amountInRow = 1;
      }

      style.gridTemplateColumns = `repeat(${amountInRow}, 1fr)`;
    });

    resizeObserver.observe(el);

    return () => resizeObserver.unobserve(el);
  }, []);

  return (
    <Wrapper>
      <TutorialsOuterWrapper>
        <TopSection>
          <Title>Learn</Title>
        </TopSection>

        <TutorialsInsideWrapper ref={insideWrapperRef}>
          {TUTORIALS.map((t, i) => (
            <TutorialCard key={i} {...t} />
          ))}
        </TutorialsInsideWrapper>
      </TutorialsOuterWrapper>
    </Wrapper>
  );
};

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
  --max-container-width: 72rem;

  padding: 2rem 3rem;
  height: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TopSection = styled.div`
  width: 100%;
  max-width: var(--max-container-width);
`;

const Title = styled.h1``;

const TutorialsInsideWrapper = styled.div`
  margin: 2rem 0;
  display: grid;
  gap: 2rem;
  width: 100%;
  max-width: var(--max-container-width);
`;

export default Tutorials;
