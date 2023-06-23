import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Atom, useAtom } from "jotai";
import styled, { css } from "styled-components";
import Split from "react-split";

import Button from "../Button";
import Markdown from "../Markdown";
import EditorWithTabs from "../../pages/ide/Panels/Main/MainView/EditorWithTabs";
import { PointedArrow } from "../Icons";
import { tutorialAtom } from "../../state";
import { StyledDefaultLink } from "../Link";
import { EventName } from "../../constants";
import {
  PgCommon,
  PgRouter,
  PgTheme,
  PgTutorial,
  TutorialData,
} from "../../utils/pg";
import { useAsyncEffect, useGetAndSetStatic } from "../../hooks";
import type { TutorialComponentProps } from "./types";

export const Tutorial: FC<TutorialComponentProps> = ({
  about,
  pages,
  files,
  defaultOpenFile,
  rtl,
  onMount,
  onComplete,
}) => {
  const [tutorial] = useAtom<TutorialData>(tutorialAtom as Atom<TutorialData>);

  const [currentPage, setCurrentPage] = useState<number>();
  const [isCompleted, setIsCompleted] = useState(false);

  const previousPageRef = useRef(currentPage);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tutorialPageRef = useRef<HTMLDivElement>(null);

  useGetAndSetStatic(
    currentPage,
    setCurrentPage,
    EventName.TUTORIAL_PAGE_STATIC
  );

  // Set initial page number
  useAsyncEffect(async () => {
    try {
      const metadata = await PgCommon.transition(
        PgTutorial.getMetadata(tutorial.name)
      );
      if (metadata.completed) setIsCompleted(true);

      setCurrentPage(metadata.pageNumber);
    } catch {
      setCurrentPage(0);
    } finally {
      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = "1";
      }
    }
  }, [tutorial.name]);

  // Save tutorial metadata
  useEffect(() => {
    previousPageRef.current = currentPage;
    if (currentPage) {
      PgTutorial.saveTutorialMetadata({ pageNumber: currentPage });
    }
  }, [currentPage]);

  // Scroll to the top on page change
  useEffect(() => {
    tutorialPageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentPage]);

  const goBackToTutorials = useCallback(() => {
    PgRouter.navigate("/tutorials");
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((c) => (c as number) + 1);
  }, []);

  const previousPage = useCallback(() => {
    setCurrentPage((c) => (c as number) - 1);
  }, []);

  const startTutorial = useCallback(async () => {
    await PgTutorial.start({
      files,
      defaultOpenFile,
      pageCount: pages.length,
    });
  }, [files, defaultOpenFile, pages.length]);

  const finishTutorial = useCallback(async () => {
    await PgTutorial.finish();
    setIsCompleted(true);
    if (onComplete) onComplete();
  }, [onComplete]);

  // Custom callbacks
  // On component mount
  useEffect(() => {
    if (onMount) onMount();
  }, [onMount]);

  // Specific page events
  useEffect(() => {
    if (!currentPage) return;

    const page = pages[currentPage - 1];
    if (page.onMount) page.onMount();
  }, [currentPage, pages]);

  // This could happen if the saved page has been deleted
  if (currentPage && !pages[currentPage - 1]) {
    setCurrentPage(1);
    return null;
  }

  return (
    <Wrapper ref={wrapperRef}>
      {currentPage === undefined ? null : currentPage === 0 ? (
        <TutorialAboutPageWrapper>
          <GoBackButtonWrapper>
            <Button
              onClick={goBackToTutorials}
              kind="no-border"
              leftIcon={<PointedArrow rotate="180deg" />}
            >
              Go back to tutorials
            </Button>
          </GoBackButtonWrapper>

          <TutorialAboutPage>
            <TutorialTopSectionWrapper>
              <TutorialName>{tutorial.name}</TutorialName>
              <TutorialAuthorsWrapper>
                <TutorialAuthorsByText>by </TutorialAuthorsByText>
                {tutorial.authors.length !== 0 &&
                  tutorial.authors.map((author, i) => (
                    <Fragment key={i}>
                      {i !== 0 && (
                        <TutorialAuthorSeperator>, </TutorialAuthorSeperator>
                      )}
                      {author.link ? (
                        <TutorialAuthorLink href={author.link}>
                          {author.name}
                        </TutorialAuthorLink>
                      ) : (
                        <TutorialWithoutLink>{author.name}</TutorialWithoutLink>
                      )}
                    </Fragment>
                  ))}
              </TutorialAuthorsWrapper>
              <TutorialDescriptionWrapper>
                <TutorialDescription>
                  {tutorial.description}
                </TutorialDescription>
                <StartTutorialButtonWrapper>
                  <Button
                    onClick={startTutorial}
                    kind={isCompleted ? "no-border" : "secondary"}
                    color={isCompleted ? "success" : undefined}
                    fontWeight="bold"
                    leftIcon={isCompleted ? <span>✔</span> : undefined}
                  >
                    {isCompleted
                      ? "COMPLETED"
                      : previousPageRef.current
                      ? "CONTINUE"
                      : "START"}
                  </Button>
                </StartTutorialButtonWrapper>
              </TutorialDescriptionWrapper>
            </TutorialTopSectionWrapper>

            <TutorialAboutSectionWrapper>
              {typeof about === "string" ? <Markdown>{about}</Markdown> : about}
            </TutorialAboutSectionWrapper>
          </TutorialAboutPage>
        </TutorialAboutPageWrapper>
      ) : (
        <PagesWrapper rtl={rtl} sizes={[60, 40]}>
          <EditorWrapper>
            <EditorWithTabs />
          </EditorWrapper>

          <TutorialPage ref={tutorialPageRef}>
            <TutorialContent>
              {typeof pages[currentPage - 1].content === "string" ? (
                <Markdown>{pages[currentPage - 1].content as string}</Markdown>
              ) : (
                pages[currentPage - 1].content
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
        </PagesWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorial.default)};

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.5rem;
      height: 0.5rem;
    }

    & ::-webkit-scrollbar-track {
      background-color: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.default.borderRadius};
      background-color: ${theme.default.scrollbar.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.default.scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.default.scrollbar.thumb.color};
    }
  `}
`;

const TutorialAboutPageWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

const GoBackButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  height: ${({ theme }) => theme.components.tabs.tab.default.height};
  padding-left: 1rem;

  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const TutorialAboutPage = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorial.aboutPage)};
  `}
`;

const TutorialTopSectionWrapper = styled.div`
  padding: 1.5rem 0;
`;

const TutorialName = styled.h1``;

const TutorialAuthorsWrapper = styled.div`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font.other.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;

const TutorialAuthorsByText = styled.span``;

const TutorialAuthorSeperator = styled.span``;

const TutorialAuthorLink = styled(StyledDefaultLink)``;

const TutorialWithoutLink = styled.span``;

const TutorialDescriptionWrapper = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
`;

const TutorialDescription = styled.p`
  color: ${({ theme }) => theme.colors.default.textSecondary};
  max-width: 85%;
  line-height: 1.5;
`;

const StartTutorialButtonWrapper = styled.div`
  margin-left: 2rem;
`;

const TutorialAboutSectionWrapper = styled.div``;

const PagesWrapper = styled(Split)<Pick<TutorialComponentProps, "rtl">>`
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

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;

  & > div:nth-child(2) {
    flex: 1;
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
