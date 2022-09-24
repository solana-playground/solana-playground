import { useEffect, lazy, Suspense, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Home from "./Home";
import { Wormhole } from "../../../Loading";
import { explorerAtom, refreshExplorerAtom } from "../../../../state";
import { ClassName } from "../../../../constants";

const CodeMirror = lazy(() => import("./CodeMirror"));

const Editor = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const [loading, setLoading] = useState(true);
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    if (explorer) {
      setLoading(false);
      if (!explorer.getTabs().length) {
        setShowHome(true);
        const maybeEditor = document.getElementById(
          ClassName.EDITOR_WRAPPER
        )?.firstChild;
        if (
          maybeEditor &&
          (maybeEditor as HTMLDivElement).classList.contains(
            ClassName.CM_CLASSNAME
          )
        ) {
          maybeEditor.remove();
        }
      } else {
        setShowHome(false);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer, explorerChanged]);

  // Save explorer metadata
  useEffect(() => {
    // Save metadata to IndexedDB if we haven't rendered in 5s
    const saveMetadataIntervalId = setInterval(() => {
      explorer?.saveMeta().catch();
    }, 5000);

    return () => clearInterval(saveMetadataIntervalId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer, explorerChanged]);

  if (loading) return <EditorLoading />;

  return (
    <Wrapper id={ClassName.EDITOR_WRAPPER}>
      <Suspense fallback={<EditorLoading />}>
        {showHome ? <Home /> : <CodeMirror />}
      </Suspense>
    </Wrapper>
  );
};

export const EDITOR_SCROLLBAR_WIDTH = "0.75rem";

const Wrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.home?.bg};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar,
    & ::-webkit-scrollbar {
      width: ${EDITOR_SCROLLBAR_WIDTH};
      height: 0.75rem;
    }

    &::-webkit-scrollbar-track,
    & ::-webkit-scrollbar-track {
      background-color: ${theme.colors.right?.bg};
      border-left: 1px solid ${theme.colors.default.borderColor};
    }

    &::-webkit-scrollbar-thumb,
    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      background-color: ${theme.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover,
    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    & ::-webkit-scrollbar-corner {
      background-color: ${theme.colors.right?.bg};
    }
  `}
`;

const EditorLoading = () => (
  <LoadingWrapper>
    <Wormhole size={10} />
  </LoadingWrapper>
);

const LoadingWrapper = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
`;

export default Editor;
