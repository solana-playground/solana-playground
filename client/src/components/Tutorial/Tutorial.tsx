import { FC, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";

import Button from "../Button";
import Markdown from "./Markdown";
import EditorWithTabs from "../Panels/Main/MainView/EditorWithTabs";
import { TutorialComponentProps } from "./types";
import { Route } from "../../constants";
import { PgView } from "../../utils/pg";

const Tutorial: FC<TutorialComponentProps> = ({ main, pages }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const navigate = useNavigate();

  const goBackToTutorials = useCallback(
    () => navigate(Route.TUTORIALS),
    [navigate]
  );
  const nextPage = useCallback(() => {
    setCurrentPage((c) => c + 1);
  }, []);
  const previousPage = useCallback(() => {
    setCurrentPage((c) => c - 1);
  }, []);

  return (
    <Wrapper>
      {currentPage === 0 ? (
        <MainWrapper>
          <Button onClick={goBackToTutorials}>Go back</Button>
          <Markdown>{main}</Markdown>
          <Button onClick={nextPage}>START COURSE</Button>
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
    height: ${PgView.getMainViewHeight()}px;
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
  height: 100%;
  overflow: auto;

  & > div {
    width: 50%;
  }
`;

const EditorWrapper = styled.div`
  height: ${PgView.getMainViewHeight()}px;
`;

const ResizeableWrapper = styled.div`
  height: 100%;
  overflow: auto;
`;

export default Tutorial;
