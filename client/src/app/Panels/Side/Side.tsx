import { useState, useEffect } from "react";
import styled, { css } from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { PgRouter, PgTheme, PgView } from "../../../utils/pg";
import { useKeybind, useRenderOnChange } from "../../../hooks";

const Side = () => {
  const page = useRenderOnChange(PgView.onDidChangeCurrentSidebarPage);

  useEffect(() => {
    // TODO: Remove after making sure `initable` initialization happens before
    // the mount of views
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
      .map((p) => ({
        keybind: p.keybind!,
        handle: () => {
          const closeCondition = width !== 0 && PgView.sidebar.name === p.name;
          setWidth(closeCondition ? 0 : oldWidth);
          PgView.sidebar.name = p.name;
        },
      })),
    [width, oldWidth]
  );

  // TODO: Remove after making sure `initable` initialization happens before the
  // mount of views
  if (!page) return null;

  return (
    <Wrapper>
      <Left
        pageName={page.name}
        setPageName={(v) => (PgView.sidebar.name = v)}
        width={width}
        setWidth={setWidth}
        oldWidth={oldWidth}
      />
      <Right
        page={page}
        width={width}
        setWidth={setWidth}
        oldWidth={oldWidth}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.sidebar.default)};
  `}
`;

export default Side;
