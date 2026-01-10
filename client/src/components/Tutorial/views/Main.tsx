import { FC, useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import EditorWithTabs from "../../EditorWithTabs";
import Markdown from "../../Markdown";
import Resizable from "../../Resizable";
import { SpinnerWithBg } from "../../Loading";
import { PointedArrow } from "../../Icons";
import { PgRouter, PgTheme, PgTutorial } from "../../../utils";
import type { TutorialMainComponentProps } from "../types";

export const Main: FC<TutorialMainComponentProps> = ({
  pageNumber,
  pages,
  layout = "editor-content",
  isStarted,
  onComplete,
  start,
}) => {
  // If the page is set from the URL but the tutorial has not been started,
  // start the tutorial automatically
  useEffect(() => {
    if (!isStarted) start();
  }, [isStarted, start]);

  // Scroll to the top on page change
  const tutorialPageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tutorialPageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber]);

  // Specific page events
  useEffect(() => {
    const page = pages.at(pageNumber - 1);
    if (page?.onMount) return page.onMount();
  }, [pageNumber, pages]);

  const nextPage = () => {
    PgTutorial.openPage(pageNumber + 1);
  };

  const previousPage = () => {
    PgTutorial.openPage(pageNumber - 1);
  };

  const finishTutorial = () => {
    PgTutorial.finish();
    if (onComplete) onComplete();
  };

  const currentPage = pages.at(pageNumber - 1);
  if (!currentPage) {
    // This could happen if the saved page has been deleted
    PgTutorial.openPage(1);
    return null;
  }

  const currentContent = currentPage.content;
  const currentLayout = currentPage.layout ?? layout;

  return (
    <Wrapper>
      {currentLayout === "editor-content" && (
        <Resizable
          enable="right"
          defaultSize={{ width: "60%", height: "100%" }}
          minWidth="25%"
          maxWidth="75%"
        >
          {isStarted ? (
            <EditorWithTabs />
          ) : (
            <SpinnerWithBg loading size="2rem" />
          )}
        </Resizable>
      )}

      <TutorialPage ref={tutorialPageRef}>
        <TutorialContent>
          {typeof currentContent === "string" ? (
            <Markdown
              linkable
              rootSrc={PgRouter.location.pathname
                .split("/")
                .slice(0, 3)
                .join("/")}
            >
              {currentContent}
            </Markdown>
          ) : (
            currentContent
          )}

          <NavigationButtonsOutsideWrapper>
            <NavigationButtonsInsideWrapper>
              {pageNumber !== 1 && (
                <PreviousWrapper>
                  <PreviousText>Previous</PreviousText>
                  <NavigationButton
                    onClick={previousPage}
                    kind="no-border"
                    leftIcon={<PointedArrow rotate="180deg" />}
                  >
                    {pages[pageNumber - 2].title ??
                      `${pageNumber - 1}/${pages.length}`}
                  </NavigationButton>
                </PreviousWrapper>
              )}

              <NextWrapper>
                <NextText>Next</NextText>
                {pageNumber === pages.length ? (
                  <NavigationButton
                    onClick={finishTutorial}
                    kind="no-border"
                    color="success"
                    rightIcon={<span>✔</span>}
                  >
                    Finish
                  </NavigationButton>
                ) : (
                  <NavigationButton
                    onClick={nextPage}
                    kind="no-border"
                    rightIcon={<PointedArrow />}
                  >
                    {pages[pageNumber].title ??
                      `${pageNumber + 1}/${pages.length}`}
                  </NavigationButton>
                )}
              </NextWrapper>
            </NavigationButtonsInsideWrapper>
          </NavigationButtonsOutsideWrapper>
        </TutorialContent>
      </TutorialPage>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  height: 100%;
`;

const TutorialPage = styled.div`
  ${({ theme }) => css`
    overflow: auto;
    max-width: 60rem;
    padding-top: ${theme.components.tabs.tab.default.height};
    background: ${theme.components.tutorial.default.bg};
  `}
`;

const TutorialContent = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.tutorial.tutorialPage)};
  `}
`;

const NavigationButtonsOutsideWrapper = styled.div`
  padding: 3rem 0;
`;

const NavigationButtonsInsideWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    width: 100%;
    padding-top: 1.5rem;
    border-top: 1px solid ${theme.colors.default.border};
    font-size: ${theme.font.other.size.small};
    font-weight: bold;
  `}
`;

const NavigationButton = styled(Button)`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font.other.size.medium};
    font-weight: bold;

    & svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  `}
`;

const PreviousWrapper = styled.div`
  width: 100%;
`;

const PreviousText = styled.div``;

const NextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
`;

const NextText = styled.div``;
