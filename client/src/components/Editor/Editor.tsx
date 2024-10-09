import { useEffect, lazy, Suspense, useState } from "react";
import styled, { css } from "styled-components";

import { SpinnerWithBg } from "../Loading";
import { Id } from "../../constants";
import { PgCommon, PgExplorer, PgTheme } from "../../utils/pg";

const Home = lazy(() => import("./Home"));
const Monaco = lazy(() => import("./Monaco"));

export const Editor = () => {
  const [showHome, setShowHome] = useState<boolean>();

  // Decide which editor to show
  useEffect(() => {
    const { dispose } = PgExplorer.onNeedRender(
      PgCommon.debounce(
        () => setShowHome(!PgExplorer.tabs.length),
        { delay: 50 } // To fix flickering on workspace deletion
      )
    );

    return () => dispose();
  }, []);

  // Save explorer metadata
  useEffect(() => {
    // Save metadata to IndexedDB every 5s
    const saveMetadataIntervalId = PgCommon.setIntervalOnFocus(() => {
      PgExplorer.saveMeta().catch();
    }, 5000);

    return () => clearInterval(saveMetadataIntervalId);
  }, []);

  if (showHome === undefined) return null;

  return (
    <Suspense fallback={<SpinnerWithBg loading size="2rem" />}>
      <Wrapper>{showHome ? <Home /> : <Monaco />}</Wrapper>
    </Suspense>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 100%;
    overflow: auto;

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
      background: ${theme.components.main.primary.home.default.bg ??
      theme.components.main.default.bg};
    }

    ${PgTheme.convertToCSS(theme.components.editor.wrapper)};
  `}
`;
