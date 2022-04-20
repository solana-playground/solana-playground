import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled from "styled-components";

import IconButton from "../../../IconButton";
import PopButton from "../../../PopButton";
import Settings from "../Right/Settings";
import Wallet from "../Right/Wallet";
import { Sidebar } from "../sidebar-values";
import { sidebarData } from "./sidebar-data";
import useActiveTab from "./useActiveTab";

const ID_PREFIX = "Icon";

interface LeftProps {
  sidebarState: string;
  setSidebarState: Dispatch<SetStateAction<Sidebar>>;
  oldSidebarRef: MutableRefObject<string>;
}

const Left: FC<LeftProps> = ({
  sidebarState,
  setSidebarState,
  oldSidebarRef,
}) => {
  useActiveTab(sidebarState, oldSidebarRef, ID_PREFIX);

  return (
    <Wrapper>
      <Icons>
        <Top>
          {sidebarData.top.map((data, i) => (
            <IconButton
              key={i}
              id={ID_PREFIX + data.value}
              title={data.title}
              src={data.src}
              onClick={() => setSidebarState(data.value)}
            />
          ))}
        </Top>
        <Bottom>
          {sidebarData.bottom.map((data, i) => (
            <PopButton
              key={i}
              PopElement={data.value === Sidebar.WALLET ? Wallet : Settings}
              buttonProps={{ ...data }}
            />
          ))}
        </Bottom>
      </Icons>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 3rem;
  user-select: none;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors?.left?.bg!};
  // display: none;
`;

const Icons = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const Top = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Bottom = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export default Left;
