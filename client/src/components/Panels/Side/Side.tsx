import { useState, useRef } from "react";
import styled from "styled-components";

import Left from "./Left";
import Right from "./Right";
import { Sidebar } from "./sidebar-values";

const Side = () => {
  const [sidebarState, setSidebarState] = useState(Sidebar.EXPLORER);
  const oldSidebarRef = useRef(sidebarState);

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
