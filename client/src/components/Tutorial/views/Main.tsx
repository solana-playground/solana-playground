import { FC, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import Split from "react-split";

import Button from "../../Button";
import EditorWithTabs from "../../EditorWithTabs";
import Markdown from "../../Markdown";
import { SpinnerWithBg } from "../../Loading";
import { PointedArrow } from "../../Icons";
import { PgRouter, PgTheme, PgTutorial } from "../../../utils/pg";
import type { TutorialMainComponentProps } from "../types";

export const Main: FC<TutorialMainComponentProps> = ({
  pageNumber,
  pages,
  layout = "editor-content",
  onComplete,
  start,
}) => {
  const tutorialPageRef = useRef<HTMLDivElement>(null);

  // Scroll to the top on page change
  useEffect(() => {
    tutorialPageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber]);

  // Specific page events
  useEffect(() => {
    const page = pages[pageNumber - 1];
    if (page.onMount) return page.onMount();
  }, [pageNumber, pages]);

  // If the page is set from the URL but the tutorial has not been started,
  // start the tutorial automatically
  const isStarted = PgTutorial.isStarted(PgTutorial.data!.name);
  useEffect(() => {
    if (!isStarted) start();
  }, [isStarted, start]);

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

  // TODO: Add a custom `Split` component because `react-split` doesn't properly
  // handle size and `children.length` changes
  const [Wrapper, props] = (
    currentLayout === "content-only"
      ? [RegularWrapper, {}]
      : [SplitWrapper, { sizes: [60, 40] }]
  ) as [typeof RegularWrapper, {}];

  return (
    <Wrapper {...props}>
      {currentLayout === "editor-content" && isStarted ? (
        <EditorWithTabs />
      ) : (
        <SpinnerWithBg loading size="2rem" />
      )}

      <TutorialPage ref={tutorialPageRef}>
        <TutorialContent>
          {typeof currentContent === "string" ? (
            <Markdown
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

const RegularWrapper = styled.div``;

const SplitWrapper = styled(Split)`
  display: flex;
  width: 100%;
  height: -webkit-fill-available;
  max-height: 100%;
  overflow: auto;

  & > div:not(.gutter) {
    min-width: 25%;
  }

  & > .gutter {
    cursor: col-resize;
  }
`;

const TutorialPage = styled.div`
  ${({ theme }) => css`
    overflow: auto;
    max-width: 60rem;
    padding-top: ${theme.components.tabs.tab.default.height};
    background: ${theme.views.main.primary.tutorial.default.bg};
  `}
`;

const TutorialContent = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorial.tutorialPage)};
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
