import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled, { css } from "styled-components";

import { GITHUB_URL } from "../../../../constants";
import IconButton from "../../../IconButton";
import Link from "../../../Link";
import PopButton from "../../../PopButton";
import Settings from "../Right/Settings";
import { Sidebar } from "../sidebar-state";
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

  const handleSidebarChange = (value: Sidebar) => {
    setSidebarState((state) => {
      if (state === value) return Sidebar.CLOSED;

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
              title={data.title}
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
    background-color: ${theme.colors?.left?.bg ?? theme.colors.default.bg};
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
