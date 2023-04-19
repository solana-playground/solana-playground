import { useEffect, lazy, Suspense, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Home from "./Home";
import { MainViewLoading } from "../../../../../../components/Loading";
import { explorerAtom, refreshExplorerAtom } from "../../../../../../state";
import { Id } from "../../../../../../constants";
import { Lang, PgCommon } from "../../../../../../utils/pg";
import { PgThemeManager } from "../../../../../../utils/pg/theme";

const CodeMirror = lazy(() => import("./CodeMirror"));
const Monaco = lazy(() => import("./Monaco"));

const Editor = () => {
  const [explorer] = useAtom(explorerAtom);
  const [explorerChanged] = useAtom(refreshExplorerAtom);

  const [showHome, setShowHome] = useState<boolean>();
  const [showMonaco, setShowMonaco] = useState<boolean>();

  // Decide which editor to show
  useEffect(() => {
    if (!explorer) return;

    setShowHome(!explorer.getTabs().length);

    const lang = explorer.getCurrentFileLanguage();
    setShowMonaco(!(lang === Lang.RUST || lang === Lang.PYTHON));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer, explorerChanged]);

  // Save explorer metadata
  useEffect(() => {
    if (!explorer) return;

    // Save metadata to IndexedDB if we haven't rendered in 5s
    const saveMetadataIntervalId = PgCommon.setIntervalOnFocus(() => {
      explorer.saveMeta().catch();
    }, 5000);

    return () => clearInterval(saveMetadataIntervalId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer, explorerChanged]);

  if (showHome === undefined || showMonaco === undefined) {
    return <MainViewLoading />;
  }

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

    ${PgThemeManager.convertToCSS(theme.components.editor.wrapper)};
  `}
`;

export default Editor;
