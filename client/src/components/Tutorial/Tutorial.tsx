import { FC, useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import { About, Main } from "./views";
import { PgCommon, PgTheme, PgTutorial } from "../../utils/pg";
import { useAsyncEffect, useRenderOnChange } from "../../hooks";
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
  useRenderOnChange(PgTutorial.onDidChange);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Transition on mount
  useAsyncEffect(async () => {
    if (wrapperRef.current) {
      await PgCommon.sleep(300);
      wrapperRef.current.style.opacity = "1";
    }
  }, []);

  // On component mount
  useEffect(() => {
    if (onMount) return onMount();
  }, [onMount]);

  return (
    <Wrapper ref={wrapperRef}>
      {PgTutorial.view === "about" ? (
        <About
          about={about}
          files={files}
          pages={pages}
          defaultOpenFile={defaultOpenFile}
        />
      ) : (
        <Main pages={pages} rtl={rtl} onComplete={onComplete} />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.main.views.tutorial.default)};
  `}
`;
