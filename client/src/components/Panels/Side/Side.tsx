import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { Sidebar } from "./sidebar-values";

const Side = () => {
  const [sidebarState, setSidebarState] = useState(Sidebar.EXPLORER);
  const oldSidebarRef = useRef(sidebarState);

  // Keybinds
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === "E") setSidebarState(Sidebar.EXPLORER);
        else if (e.key === "B") {
          e.preventDefault();
          setSidebarState(Sidebar.BUILD_DEPLOY);
        } else if (e.key === "D") {
          // T doesn't work
          e.preventDefault();
          setSidebarState(Sidebar.TEST);
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [setSidebarState]);

  return (
    <Wrapper>
      <Left
        sidebarState={sidebarState}
        setSidebarState={setSidebarState}
        oldSidebarRef={oldSidebarRef}
      />
      <Right sidebarState={sidebarState} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 20fr;
`;

export default Side;
