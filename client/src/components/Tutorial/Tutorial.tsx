import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";

import Button from "../Button";
import Markdown from "./Markdown";
import EditorWithTabs from "../Panels/Main/MainView/EditorWithTabs";
import { Sidebar } from "../Panels/Side/sidebar-state";
import { PgExplorer, PgTutorial, PgView } from "../../utils/pg";
import { Route } from "../../constants";
import { TutorialComponentProps } from "./types";

export const Tutorial: FC<TutorialComponentProps> = ({
  main,
  pages,
  files,
  defaultOpenFile,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const previousPageRef = useRef(currentPage);

  const navigate = useNavigate();

  const goBackToTutorials = useCallback(() => {
    PgView.setSidebarState(Sidebar.TUTORIALS);
    navigate(Route.TUTORIALS);
  }, [navigate]);
  const nextPage = useCallback(() => {
    setCurrentPage((c) => c + 1);
  }, []);
  const previousPage = useCallback(() => {
    setCurrentPage((c) => c - 1);
  }, []);
  const startTutorial = useCallback(async () => {
    const explorer = await PgExplorer.get();
    const tutorialWorkspaceName = await PgTutorial.getTutorialWorkspaceName();
    if (explorer.allWorkspaceNames?.includes(tutorialWorkspaceName)) {
      console.log(1);
      // Start from where the user left off
    } else {
      console.log(2);
      // Initial tutorial setup
      await explorer.newWorkspace(tutorialWorkspaceName, {
        files,
        defaultOpenFile:
          files.length > 0 ? defaultOpenFile ?? files[0][0] : undefined,
      });
    }

    PgView.setSidebarState(Sidebar.EXPLORER);
    setCurrentPage(1);
  }, [files, defaultOpenFile]);

  useEffect(() => {
    const disposable = PgView.onDidChangeSidebarState((state) => {
      if (currentPage !== 0) {
        previousPageRef.current = currentPage;
      }

      if (state === Sidebar.TUTORIALS) {
        setCurrentPage(0);
      } else if (previousPageRef.current !== 0) {
        setCurrentPage(previousPageRef.current);
      }
    });

    return () => disposable.dispose();
  }, [currentPage]);

  return (
    <Wrapper>
      {currentPage === 0 ? (
        <MainWrapper>
          <Button onClick={goBackToTutorials}>Go back</Button>
          <Markdown>{main}</Markdown>
          <Button onClick={startTutorial}>START TUTORIAL</Button>
        </MainWrapper>
      ) : (
        <PagesWrapper>
          <EditorWrapper>
            <EditorWithTabs />
          </EditorWrapper>
          <Resizeable>
            <Button onClick={goBackToTutorials}>Go back</Button>
            <Markdown>{pages[currentPage - 1]}</Markdown>
            {currentPage !== 1 && (
              <Button onClick={previousPage}>Previous Page</Button>
            )}
            {currentPage !== pages.length && (
              <Button onClick={nextPage}>Next Page</Button>
            )}
          </Resizeable>
        </PagesWrapper>
      )}
    </Wrapper>
  );
};

const Resizeable: FC = ({ children }) => (
  <ResizeableWrapper>{children}</ResizeableWrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.tutorial?.bg};
    color: ${theme.colors.tutorial?.color};

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

const MainWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

const PagesWrapper = styled.div`
  display: flex;
  width: 100%;
  overflow: auto;
  height: -webkit-fill-available;
  max-height: 100%;

  & > div {
    width: 50%;
  }
`;

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;

  & > div:nth-child(2) {
    flex: 1;
  }
`;

const ResizeableWrapper = styled.div`
  height: 100%;
  overflow: auto;
`;
