import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { Sidebar } from "./sidebar-state";
import { PgCommon } from "../../../utils/pg";

const Side = () => {
  const [sidebarState, setSidebarState] = useState(Sidebar.EXPLORER);
  const [width, setWidth] = useState(320);
  const [oldWidth, setOldWidth] = useState(width);

  useEffect(() => {
    if (width) setOldWidth(width);
  }, [width, setOldWidth]);

  const oldSidebarRef = useRef(sidebarState);

  // Keybinds
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (PgCommon.isKeyctrlOrCmd(e) && e.shiftKey) {
        setSidebarState((state) => {
          const key = e.key;
          const closeCondition =
            width !== 0 &&
            ((state === Sidebar.EXPLORER && key === "E") ||
              (state === Sidebar.BUILD_DEPLOY && key === "B") ||
              (state === Sidebar.TEST && key === "D"));

          const defaultFn = () => {
            e.preventDefault();
            setWidth(oldWidth);
          };

          if (closeCondition) {
            e.preventDefault();
            setWidth(0);
          } else if (key === "E") {
            defaultFn();
            return Sidebar.EXPLORER;
          } else if (key === "B") {
            defaultFn();
            return Sidebar.BUILD_DEPLOY;
          } else if (key === "D") {
            // T doesn't work
            defaultFn();
            return Sidebar.TEST;
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
