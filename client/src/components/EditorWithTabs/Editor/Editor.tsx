import { useEffect, lazy, Suspense, useState } from "react";
import styled, { css } from "styled-components";

import Home from "./Home";
import { MainViewLoading } from "../../Loading";
import { Id } from "../../../constants";
import { Lang, PgCommon, PgExplorer, PgTheme } from "../../../utils/pg";

const CodeMirror = lazy(() => import("./CodeMirror"));
const Monaco = lazy(() => import("./Monaco"));

export const Editor = () => {
  const [showHome, setShowHome] = useState<boolean>();
  const [showMonaco, setShowMonaco] = useState<boolean>();

  // Decide which editor to show
  useEffect(() => {
    const editor = PgExplorer.onNeedRender(() => {
      const file = PgExplorer.getCurrentFile();
      if (!file) setShowMonaco(false);
      else {
        const lang = PgExplorer.getLanguageFromPath(file.path);
        setShowMonaco(!(lang === Lang.RUST || lang === Lang.PYTHON));
      }
    });

    const home = PgExplorer.onNeedRender(
      PgCommon.debounce(
        () => setShowHome(!PgExplorer.getTabs().length),
        { delay: 50 } // To fix flickering on workspace deletion
      )
    );

    return () => {
      editor.dispose();
      home.dispose();
    };
  }, []);

  // Save explorer metadata
  useEffect(() => {
    // Save metadata to IndexedDB every 5s
    const saveMetadataIntervalId = PgCommon.setIntervalOnFocus(() => {
      PgExplorer.saveMeta().catch();
    }, 5000);

    return () => clearInterval(saveMetadataIntervalId);
  }, []);

  if (showHome === undefined || showMonaco === undefined) return null;

  return (
    <Suspense fallback={<MainViewLoading />}>
      <Wrapper>
        {showHome ? <Home /> : showMonaco ? <Monaco /> : <CodeMirror />}
      </Wrapper>
    </Suspense>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow: auto;

    & > div {
      height: 100%;
    }

    /**
     * Changing the home background only changes the part that is in view and
     * the remaining parts still have 'main.default.bg' which causes problem if
     * they are different. This selector selects the current element when home
     * is in view and sets the background to 'home.default.bg'.
     *
     * The reason we are setting the background in this element is also partly
     * due to Monaco editor's incompatibility with background-image property.
     * We are able to solve this problem by seting the editor's background to
     * transparent and set this(wrapper) element's background to background-image.
     */
    &:has(> #${Id.HOME}) {
      background: ${theme.components.main.views.home.default.bg ??
      theme.components.main.default.bg};
    }

    ${PgTheme.convertToCSS(theme.components.editor.wrapper)};
  `}
`;
