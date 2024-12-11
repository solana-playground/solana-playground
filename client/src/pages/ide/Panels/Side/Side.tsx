import { useState, useRef, useEffect } from "react";
import styled, { css } from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { EventName } from "../../../../constants";
import { SIDEBAR } from "../../../../views";
import { PgCommon, PgRouter, PgTheme } from "../../../../utils/pg";
import { useKeybind, useSetStatic } from "../../../../hooks";

const Side = () => {
  const [sidebarPage, setSidebarPage] = useState<SidebarPageName>("Explorer");
  const oldSidebarRef = useRef(sidebarPage);
  useSetStatic(setSidebarPage, EventName.VIEW_SIDEBAR_STATE_SET);
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_ON_DID_CHANGE_SIDEBAR_PAGE,
      sidebarPage
    );
  }, [sidebarPage]);
  useEffect(() => {
    const page = SIDEBAR.find((p) => p.name === sidebarPage)!;
    if (page.route && !PgRouter.location.pathname.startsWith(page.route)) {
      PgRouter.navigate(page.route);
    }

    return page.handle?.()?.dispose;
  }, [sidebarPage]);

  const [width, setWidth] = useState(320);
  const [oldWidth, setOldWidth] = useState(width);
  useEffect(() => {
    if (width) setOldWidth(width);
  }, [width]);

  // Handle keybinds
  useKeybind(
    SIDEBAR.filter((p) => p.keybind).map((p) => ({
      keybind: p.keybind!,
      handle: () => {
        setSidebarPage((page) => {
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
        sidebarPage={sidebarPage}
        setSidebarPage={setSidebarPage}
        oldSidebarRef={oldSidebarRef}
        width={width}
        setWidth={setWidth}
        oldWidth={oldWidth}
      />
      <Right
        sidebarPage={sidebarPage}
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
