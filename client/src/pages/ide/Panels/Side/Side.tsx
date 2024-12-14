import { useState, useRef, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { EventName } from "../../../../constants";
import { PgCommon, PgRouter, PgTheme, PgView } from "../../../../utils/pg";
import { useKeybind, useSetStatic } from "../../../../hooks";

const Side = () => {
  const [pageName, setPageName] = useState<SidebarPageName>("Explorer");
  const oldPageName = useRef(pageName);
  useSetStatic(setPageName, EventName.VIEW_SIDEBAR_PAGE_NAME_SET);

  const page = useMemo(() => PgView.getSidebarPage(pageName), [pageName]);
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_ON_DID_CHANGE_SIDEBAR_PAGE,
      page
    );
  }, [page]);
  useEffect(() => {
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
    PgView.sidebar
      .filter((p) => p.keybind)
      .map((p) => ({
        keybind: p.keybind!,
        handle: () => {
          setPageName((page) => {
            const closeCondition = width !== 0 && page === p.name;
            setWidth(closeCondition ? 0 : oldWidth);
            return p.name;
          });
        },
      })),
    [width, oldWidth]
  );

  return (
    <Wrapper>
      <Left
        pageName={pageName}
        setPageName={setPageName}
        oldPageName={oldPageName}
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
    ${PgTheme.convertToCSS(theme.components.sidebar.default)};
  `}
`;

export default Side;
