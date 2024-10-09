import { FC, useEffect } from "react";
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

  // On component mount
  useEffect(() => {
    if (onMount) return onMount();
  }, [onMount]);

  return (
    <Wrapper>
      {PgTutorial.view === "about" ? (
        <About
          about={about}
          files={files}
          pages={pages}
          defaultOpenFile={defaultOpenFile}
        />
      ) : (
        <Main pages={pages} layout={layout} onComplete={onComplete} />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.main.primary.tutorial.default)};
  `}
`;
