import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Atom, useAtom } from "jotai";
import styled, { css } from "styled-components";
import Split from "react-split";

import Button from "../Button";
import Markdown from "./Markdown";
import EditorWithTabs from "../Panels/Main/MainView/EditorWithTabs";
import { TAB_HEIGHT } from "../Panels/Main/MainView/Tabs";
import { Sidebar } from "../Panels/Side/sidebar-state";
import {
  PgCommon,
  PgExplorer,
  PgRouter,
  PgTutorial,
  PgView,
  TutorialData,
} from "../../utils/pg";
import { EventName, Route } from "../../constants";
import { PointedArrow } from "../Icons";
import { TutorialComponentProps } from "./types";
import { tutorialAtom } from "../../state";
import { StyledDefaultLink } from "../Link";
import { useGetAndSetStatic } from "../../hooks";

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
  useEffect(() => {
    (async () => {
      try {
        const metadata = await PgCommon.transition(
          PgTutorial.getMetadata(tutorial.name)
        );
        if (metadata.completed) {
          setIsCompleted(true);
          setCurrentPage(0);
          PgView.setSidebarState(Sidebar.TUTORIALS);
        } else {
          setCurrentPage(metadata.pageNumber);
          PgView.setSidebarState(Sidebar.EXPLORER);
        }
      } catch {
        setCurrentPage(0);
      } finally {
        if (wrapperRef.current) {
          wrapperRef.current.style.opacity = "1";
        }
      }
    })();
  }, [tutorial.name]);

  // Handle page number based on sidebar state change
  useEffect(() => {
    const disposable = PgView.onDidChangeSidebarState((state) => {
      if (currentPage) {
        previousPageRef.current = currentPage;
      }

      if (state === Sidebar.TUTORIALS) {
        setCurrentPage(0);
      } else if (previousPageRef.current) {
        setCurrentPage(previousPageRef.current);
      }
    });

    return () => disposable.dispose();
  }, [currentPage]);

  // Save tutorial metadata
  useEffect(() => {
    if (!currentPage) return;
    PgTutorial.saveTutorialMeta({
      pageNumber: currentPage,
      pageCount: pages.length,
    });
  }, [currentPage, pages.length]);

  // Change workspace if it hasn't been changed yet
  useEffect(() => {
    if (!currentPage) return;

    (async () => {
      const explorer = await PgExplorer.get();
      if (explorer.currentWorkspaceName !== tutorial.name) {
        await explorer.changeWorkspace(tutorial.name);
      }
    })();
  }, [currentPage, tutorial.name]);

  // Scroll to the top on page change
  useEffect(() => {
    tutorialPageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentPage]);

  const goBackToTutorials = useCallback(() => {
    PgView.setSidebarState(Sidebar.TUTORIALS);
    PgRouter.navigate(Route.TUTORIALS);
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
    if (page.onMount) {
      page.onMount();
    }
  }, [currentPage, pages]);

  // This could happen if the saved page has been deleted
  if (currentPage && !pages[currentPage - 1]) {
    setCurrentPage(1);
    return null;
  }

  return (
    <Wrapper ref={wrapperRef}>
      {currentPage === undefined ? null : currentPage === 0 ? (
        <TutorialMainPageWrapper>
          <GoBackButtonWrapper>
            <Button
              onClick={goBackToTutorials}
              kind="no-border"
              leftIcon={<PointedArrow rotate="180deg" />}
            >
              Back
            </Button>
          </GoBackButtonWrapper>

          <TutorialMainPage>
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
          </TutorialMainPage>
        </TutorialMainPageWrapper>
      ) : (
        <PagesWrapper rtl={rtl}>
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
                      <Button
                        onClick={previousPage}
                        kind="no-border"
                        fontWeight="bold"
                        leftIcon={<PointedArrow rotate="180deg" />}
                      >
                        {pages[currentPage - 2].title ??
                          `${currentPage - 1}/${pages.length}`}
                      </Button>
                    </PreviousWrapper>
                  )}
                  <NextWrapper>
                    <NextText>Next</NextText>
                    {currentPage === pages.length ? (
                      <Button
                        onClick={finishTutorial}
                        kind="no-border"
                        color="success"
                        fontWeight="bold"
                        rightIcon={<span>✔</span>}
                      >
                        Finish
                      </Button>
                    ) : (
                      <Button
                        onClick={nextPage}
                        kind="no-border"
                        fontWeight="bold"
                        rightIcon={<PointedArrow />}
                      >
                        {pages[currentPage].title ??
                          `${currentPage + 1}/${pages.length}`}
                      </Button>
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
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.tutorial?.bg};
    color: ${theme.colors.tutorial?.color};
    opacity: 0;
    transition: opacity ${theme.transition?.duration?.medium}
      ${theme.transition?.type};

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
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const TutorialMainPageWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

const GoBackButtonWrapper = styled.div`
  height: ${TAB_HEIGHT};
  display: flex;
  align-items: center;
  padding-left: 1rem;

  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const TutorialMainPage = styled.div`
  ${({ theme }) => css`
    max-width: 60rem;
    padding: 2rem;
    background: green;
    font-family: ${theme.font?.other?.family};
    font-size: ${theme.font?.other?.size.medium};
    background-color: ${theme.colors.markdown?.bg};
    color: ${theme.colors.markdown?.color};
    border-top-right-radius: ${theme.borderRadius};
    border-bottom-right-radius: ${theme.borderRadius};
  `}
`;

const TutorialTopSectionWrapper = styled.div`
  padding: 1.5rem 0;
`;

const TutorialName = styled.h1``;

const TutorialAuthorsWrapper = styled.div`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font?.other?.size.small};
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
  overflow: auto;
  height: -webkit-fill-available;
  max-height: 100%;

  & > div:not(.gutter) {
    width: 50%;
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
    height: 100%;
    max-width: 60rem;
    overflow: auto;
    padding-top: ${TAB_HEIGHT};
    font-family: ${theme.font?.other?.family};
  `}
`;

const TutorialContent = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.markdown?.bg};
`;

const NavigationButtonsOutsideWrapper = styled.div`
  padding: 3rem 0;
  max-width: 60rem;
  background-color: ${({ theme }) => theme.colors.markdown?.bg};
`;

const NavigationButtonsInsideWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    width: 100%;
    padding-top: 1.5rem;
    font-weight: bold;
    border-top: 1px solid ${theme.colors.default.borderColor};

    & button {
      margin-top: 0.5rem;
      font-size: ${theme.font?.code?.size.large};

      & svg {
        width: 1.25rem;
        height: 1.25rem;
      }
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
