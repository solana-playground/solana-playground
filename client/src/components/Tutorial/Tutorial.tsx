import { FC, useCallback, useEffect } from "react";
import styled, { css } from "styled-components";

import { About, Main } from "./views";
import { PgTheme, PgTutorial } from "../../utils/pg";
import { useRenderOnChange } from "../../hooks";
import type { TutorialComponentProps } from "./types";

export const Tutorial: FC<TutorialComponentProps> = ({
  about,
  pages,
  files,
  defaultOpenFile,
  layout,
  onMount,
  onComplete,
}) => {
  useRenderOnChange(PgTutorial.onDidChange);

  const start = useCallback(async () => {
    await PgTutorial.start({
      files,
      defaultOpenFile,
    });
  }, [files, defaultOpenFile]);

  // Start the tutorial when the page number is set
  useEffect(() => {
    if (PgTutorial.pageNumber && !PgTutorial.isStarted(PgTutorial.data!.name)) {
      start();
    }
  }, [start]);

  // On component mount
  useEffect(() => {
    if (onMount) return onMount();
  }, [onMount]);

  return (
    <Wrapper>
      {PgTutorial.view === "about" ? (
        <About about={about} start={start} />
      ) : (
        <Main pages={pages} layout={layout} onComplete={onComplete} />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.views.main.primary.tutorial.default)};
  `}
`;
