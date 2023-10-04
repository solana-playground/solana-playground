import { FC, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import Split from "react-split";

import Button from "../../Button";
import Markdown from "../../Markdown";
import { EditorWithTabs } from "../../EditorWithTabs";
import { PointedArrow } from "../../Icons";
import { PgTheme, PgTutorial } from "../../../utils/pg";
import type {
  TutorialComponentProps,
  TutorialMainComponentProps,
} from "../types";

export const Main: FC<TutorialMainComponentProps> = ({
  pages,
  rtl,
  onComplete,
}) => {
  const currentPage = PgTutorial.pageNumber!;

  const tutorialPageRef = useRef<HTMLDivElement>(null);

  // Scroll to the top on page change
  useEffect(() => {
    tutorialPageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentPage]);

  // Specific page events
  useEffect(() => {
    if (!currentPage) return;

    const page = pages[currentPage - 1];
    if (page.onMount) return page.onMount();
  }, [currentPage, pages]);

  const nextPage = () => {
    PgTutorial.pageNumber! += 1;
  };

  const previousPage = () => {
    PgTutorial.pageNumber! -= 1;
  };

  const finishTutorial = () => {
    PgTutorial.finish();
    if (onComplete) onComplete();
  };

  // This could happen if the saved page has been deleted
  if (currentPage && !pages[currentPage - 1]) {
    PgTutorial.pageNumber = 1;
    return null;
  }

  const currentContent = pages[currentPage - 1].content;

  return (
    <Wrapper rtl={rtl} sizes={[60, 40]}>
      <EditorWithTabs />

      <TutorialPage ref={tutorialPageRef}>
        <TutorialContent>
          {typeof currentContent === "string" ? (
            <Markdown>{currentContent}</Markdown>
          ) : (
            currentContent
          )}

          <NavigationButtonsOutsideWrapper>
            <NavigationButtonsInsideWrapper>
              {currentPage !== 1 && (
                <PreviousWrapper>
                  <PreviousText>Previous</PreviousText>
                  <NavigationButton
                    onClick={previousPage}
                    kind="no-border"
                    leftIcon={<PointedArrow rotate="180deg" />}
                  >
                    {pages[currentPage - 2].title ??
                      `${currentPage - 1}/${pages.length}`}
                  </NavigationButton>
                </PreviousWrapper>
              )}

              <NextWrapper>
                <NextText>Next</NextText>
                {currentPage === pages.length ? (
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
                    {pages[currentPage].title ??
                      `${currentPage + 1}/${pages.length}`}
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

const Wrapper = styled(Split)<Pick<TutorialComponentProps, "rtl">>`
  display: flex;
  flex-direction: ${({ rtl }) => (rtl ? "row-reverse" : "row")};
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
    background: ${theme.components.main.views.tutorial.default.bg};
  `}
`;

const TutorialContent = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorial.tutorialPage)};
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
