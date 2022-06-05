import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled, { css } from "styled-components";

import IconButton from "../../../IconButton";
import Link from "../../../Link";
import PopButton from "../../../PopButton";
import Settings from "../Right/Settings";
import useActiveTab, { ID_PREFIX } from "./useActiveTab";
import { GITHUB_URL } from "../../../../constants";
import { PgCommon } from "../../../../utils/pg";
import { Sidebar } from "../sidebar-state";
import { sidebarData } from "./sidebar-data";

interface LeftProps {
  sidebarState: Sidebar;
  setSidebarState: Dispatch<SetStateAction<Sidebar>>;
  oldSidebarRef: MutableRefObject<Sidebar>;
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
  oldWidth: number;
}

const Left: FC<LeftProps> = ({
  sidebarState,
  setSidebarState,
  oldSidebarRef,
  width,
  setWidth,
  oldWidth,
}) => {
  useActiveTab(sidebarState, oldSidebarRef, width);

  const handleSidebarChange = (value: Sidebar) => {
    setSidebarState((state) => {
      if (!width) setWidth(oldWidth);
      else if (state === value) setWidth(0);

      return value;
    });
  };

  return (
    <Wrapper>
      <Icons>
        <Top>
          {sidebarData.top.map((data, i) => (
            <IconButton
              key={i}
              id={ID_PREFIX + data.value}
              title={PgCommon.getKeybindTextOS(data.title)}
              src={data.src}
              onClick={() => handleSidebarChange(data.value)}
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
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    width: ${ICONBAR_WIDTH};
    user-select: none;
    overflow: hidden;
    background-color: ${theme.colors?.left?.bg ??
    theme.colors.default.bgPrimary};
    border-right: 1px solid ${theme.colors.default.borderColor};
  `}
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
