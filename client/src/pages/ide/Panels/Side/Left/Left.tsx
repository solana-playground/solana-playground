import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled, { css } from "styled-components";

import IconButton from "../../../../../components/IconButton";
import Link from "../../../../../components/Link";
import PopButton from "../../../../../components/PopButton";
import Settings from "../Right/Settings";
import useActiveTab, { ID_PREFIX } from "./useActiveTab";
import { sidebarData } from "./sidebar-data";
import { GITHUB_URL } from "../../../../../constants";
import { PgCommon, Sidebar } from "../../../../../utils/pg";
import { PgThemeManager } from "../../../../../utils/pg/theme";

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
              <PopButton key={i} PopElement={Settings} buttonProps={data} />
            );
          })}
        </Bottom>
      </Icons>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    user-select: none;
    overflow: hidden;

    ${PgThemeManager.convertToCSS(theme.components.sidebar.left.default)};
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
