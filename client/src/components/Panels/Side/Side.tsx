import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { Sidebar } from "./sidebar-state";
import { PgCommon } from "../../../utils/pg";
import { EventName, Route } from "../../../constants";
import { useSetStatic } from "../../../hooks";

const Side = () => {
  const { pathname } = useLocation();

  const [sidebarState, setSidebarState] = useState(
    pathname.startsWith(Route.TUTORIALS) ? Sidebar.TUTORIALS : Sidebar.EXPLORER
  );
  const [width, setWidth] = useState(320);
  const [oldWidth, setOldWidth] = useState(width);

  useEffect(() => {
    if (width) setOldWidth(width);
  }, [width, setOldWidth]);

  const oldSidebarRef = useRef(sidebarState);

  useSetStatic(setSidebarState, EventName.VIEW_SIDEBAR_STATE_SET);

  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_ON_DID_CHANGE_SIDEBAR_STATE,
      { state: sidebarState }
    );
  }, [sidebarState]);

  const navigate = useNavigate();

  useEffect(() => {
    if (
      sidebarState === Sidebar.TUTORIALS &&
      !pathname.startsWith(Route.TUTORIALS)
    ) {
      navigate(Route.TUTORIALS);
    } else if (
      sidebarState !== Sidebar.TUTORIALS &&
      pathname === Route.TUTORIALS
    ) {
      navigate("/");
    }
  }, [sidebarState, pathname, navigate]);

  // Keybinds
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (PgCommon.isKeyCtrlOrCmd(e) && e.shiftKey) {
        setSidebarState((state) => {
          const key = e.key.toUpperCase();
          const closeCondition =
            width !== 0 &&
            ((state === Sidebar.EXPLORER && key === "E") ||
              (state === Sidebar.BUILD_DEPLOY && key === "B") ||
              (state === Sidebar.TEST && key === "D") ||
              (state === Sidebar.TUTORIALS && key === "L"));

          const preventDefaultAndSetWidth = (w: number = oldWidth) => {
            e.preventDefault();
            setWidth(w);
          };

          if (closeCondition) {
            preventDefaultAndSetWidth(0);
          } else if (key === "E") {
            preventDefaultAndSetWidth();
            return Sidebar.EXPLORER;
          } else if (key === "B") {
            preventDefaultAndSetWidth();
            return Sidebar.BUILD_DEPLOY;
          } else if (key === "D") {
            // T doesn't work
            preventDefaultAndSetWidth();
            return Sidebar.TEST;
          } else if (key === "L") {
            // T doesn't work
            preventDefaultAndSetWidth();
            return Sidebar.TUTORIALS;
          }

          return state;
        });
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [width, oldWidth, setSidebarState, setWidth]);

  return (
    <Wrapper>
      <Left
        sidebarState={sidebarState}
        setSidebarState={setSidebarState}
        oldSidebarRef={oldSidebarRef}
        width={width}
        setWidth={setWidth}
        oldWidth={oldWidth}
      />
      <Right sidebarState={sidebarState} width={width} setWidth={setWidth} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
`;

export default Side;
