import { FC, SetStateAction, Dispatch, MutableRefObject } from "react";
import styled, { css } from "styled-components";

import IconButton from "../../../../../components/IconButton";
import Link from "../../../../../components/Link";
import PopButton from "../../../../../components/PopButton";
import Settings from "./Settings";
import { SIDEBAR } from "../../../../../views/sidebar";
import { GITHUB_URL } from "../../../../../constants";
import { PgCommon, PgTheme } from "../../../../../utils/pg";
import { ID_PREFIX, useActiveTab } from "./useActiveTab";

interface LeftProps<P = SidebarPageName, W = number> {
  sidebarPage: P;
  setSidebarPage: Dispatch<SetStateAction<P>>;
  oldSidebarRef: MutableRefObject<P>;
  width: W;
  setWidth: Dispatch<SetStateAction<W>>;
  oldWidth: W;
}

const Left: FC<LeftProps> = ({
  sidebarPage,
  setSidebarPage,
  oldSidebarRef,
  width,
  setWidth,
  oldWidth,
}) => {
  useActiveTab(sidebarPage, oldSidebarRef, width);

  const handleSidebarChange = (value: SidebarPageName) => {
    setSidebarPage((state) => {
      if (!width) setWidth(oldWidth);
      else if (state === value) setWidth(0);

      return value;
    });
  };

  return (
    <Wrapper>
      <Icons>
        <Top>
          {SIDEBAR.map((page, i) => (
            <IconButton
              key={i}
              id={ID_PREFIX + page.name}
              title={PgCommon.getKeybindTextOS(page.title)}
              src={page.icon}
              onClick={() => handleSidebarChange(page.name)}
            />
          ))}
        </Top>

        <Bottom>
          <Link href={GITHUB_URL} showExternalIcon={false}>
            <IconButton title="GitHub" src="/icons/sidebar/github.png" />
          </Link>

          <PopButton
            PopElement={Settings}
            buttonProps={{
              title: "Settings",
              src: "/icons/sidebar/settings.webp",
            }}
          />
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

    ${PgTheme.convertToCSS(theme.components.sidebar.left.default)};
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
