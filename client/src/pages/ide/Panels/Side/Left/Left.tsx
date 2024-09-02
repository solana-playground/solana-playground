import {
  FC,
  SetStateAction,
  Dispatch,
  MutableRefObject,
  useEffect,
} from "react";
import styled, { css, useTheme } from "styled-components";

import SidebarButton from "./SidebarButton";
import Settings from "./Settings";
import Link from "../../../../../components/Link";
import Popover from "../../../../../components/Popover";
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
  useActiveTab({ sidebarPage, oldSidebarRef, width });

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
          {SIDEBAR.map((page) => (
            <SidebarButton
              key={page.name}
              tooltipEl={PgCommon.getKeybindTextOS(page.title)}
              id={getId(page.name)}
              src={page.icon}
              onClick={() => handleSidebarChange(page.name)}
            />
          ))}
        </Top>

        <Bottom>
          <Link href={GITHUB_URL}>
            <SidebarButton tooltipEl="GitHub" src="/icons/sidebar/github.png" />
          </Link>

          <Popover popEl={<Settings />} stackingContext="below-modal">
            <SidebarButton
              tooltipEl="Settings"
              src="/icons/sidebar/settings.webp"
            />
          </Popover>
        </Bottom>
      </Icons>
    </Wrapper>
  );
};

const useActiveTab = <P extends SidebarPageName>({
  sidebarPage,
  oldSidebarRef,
  width,
}: Pick<LeftProps<P>, "sidebarPage" | "oldSidebarRef" | "width">) => {
  const theme = useTheme();

  useEffect(() => {
    const oldEl = document.getElementById(getId(oldSidebarRef.current));
    oldEl?.classList.remove(ClassName.ACTIVE);

    const current = width !== 0 ? sidebarPage : "Closed";
    const newEl = document.getElementById(getId(current));
    newEl?.classList.add(ClassName.ACTIVE);

    oldSidebarRef.current = sidebarPage;
  }, [sidebarPage, oldSidebarRef, width, theme.name]);
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
