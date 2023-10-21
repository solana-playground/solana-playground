import {
  FC,
  SetStateAction,
  Dispatch,
  MutableRefObject,
  useEffect,
} from "react";
import styled, { css, useTheme } from "styled-components";

import IconButton from "../../../../../components/IconButton";
import Link from "../../../../../components/Link";
import PopButton from "../../../../../components/PopButton";
import Settings from "./Settings";
import { SIDEBAR } from "../../../../../views/sidebar";
import { ClassName, GITHUB_URL } from "../../../../../constants";
import { PgCommon, PgTheme } from "../../../../../utils/pg";

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
              id={getId(page.name)}
              title={PgCommon.getKeybindTextOS(page.title)}
              src={page.icon}
              onClick={() => handleSidebarChange(page.name)}
            />
          ))}
        </Top>

        <Bottom>
          <Link href={GITHUB_URL}>
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

const useActiveTab = <P extends SidebarPageName>(
  currentPage: P,
  oldPageRef: MutableRefObject<P>,
  width: number
) => {
  const theme = useTheme();

  useEffect(() => {
    const oldEl = document.getElementById(getId(oldPageRef.current));
    oldEl?.classList.remove(ClassName.ACTIVE);

    const current = width !== 0 ? currentPage : "Closed";
    const newEl = document.getElementById(getId(current));
    newEl?.classList.add(ClassName.ACTIVE);

    oldPageRef.current = currentPage;
  }, [currentPage, oldPageRef, width, theme.name]);
};

const getId = (id: string) => "sidebar" + id;

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
