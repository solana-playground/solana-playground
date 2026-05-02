import { useState, useEffect } from "react";
import styled, { css } from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { SpinnerWithBg } from "../../../components/Loading";
import { PgRouter, PgTheme, PgView } from "../../../utils";
import { useKeybind, useRenderOnChange } from "../../../hooks";

const Side = () => {
  const page = useRenderOnChange(PgView.onDidChangeCurrentSidebarPage);

  // Set page name (setting the same name handles open/close state)
  const setPageName = (pageName: typeof PgView.sidebar.name) => {
    PgView.sidebar.name = pageName;

    // Page name update happens in the next event loop, use timeout here to sync
    //
    // TODO: Remove the timeout if we move the width state to `PgView`
    setTimeout(() => {
      if (!width) setWidth(oldWidth);
      else if (pageName === page?.name) setWidth(0);
    });
  };

  // Handle routes
  useEffect(() => {
    if (!page) return;

    if (page.route && !PgRouter.location.pathname.startsWith(page.route)) {
      PgRouter.navigate(page.route);
    }

    return page.handle?.()?.dispose;
  }, [page]);

  const [width, setWidth] = useState(320);
  const [oldWidth, setOldWidth] = useState(width);
  useEffect(() => {
    if (width) setOldWidth(width);
  }, [width]);

  // Handle keybinds
  useKeybind(
    PgView.allSidebarPages
      .filter((p) => p.keybind)
      .map((p) => ({ keybind: p.keybind!, handle: () => setPageName(p.name) })),
    [setPageName]
  );

  return (
    <SpinnerWithBg loading={!page}>
      <Wrapper>
        <Left
          pageName={PgView.sidebar.name}
          setPageName={setPageName}
          width={width}
        />
        <Right
          page={page}
          width={width}
          setWidth={setWidth}
          oldWidth={oldWidth}
        />
      </Wrapper>
    </SpinnerWithBg>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.sidebar.default)};
  `}
`;

export default Side;
