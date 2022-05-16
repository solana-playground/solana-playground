import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled from "styled-components";

import { GITHUB_URL } from "../../../../constants";
import IconButton from "../../../IconButton";
import Link from "../../../Link";
import PopButton from "../../../PopButton";
import Settings from "../Right/Settings";
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
          {sidebarData.bottom.map((data, i) => {
            if (data.value === Sidebar.GITHUB)
              return (
                <Link key={i} href={GITHUB_URL} showExternalIcon={false}>
                  <IconButton title={data.title} src={data.src} />
                </Link>
              );

            return (
              <PopButton
                key={i}
                PopElement={Settings}
                buttonProps={{ ...data }}
              />
            );
          })}
        </Bottom>
      </Icons>
    </Wrapper>
  );
};

export const ICONBAR_WIDTH = "3rem";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${ICONBAR_WIDTH};
  user-select: none;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors?.left?.bg!};
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
