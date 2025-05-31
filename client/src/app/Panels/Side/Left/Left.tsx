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
import Link from "../../../../components/Link";
import Popover from "../../../../components/Popover";
import { GITHUB_URL } from "../../../../constants";
import { PgCommon, PgTheme, PgView } from "../../../../utils/pg";

interface LeftProps<P = SidebarPageName, W = number> {
  pageName: P;
  setPageName: Dispatch<SetStateAction<P>>;
  oldPageName: MutableRefObject<P>;
  width: W;
  setWidth: Dispatch<SetStateAction<W>>;
  oldWidth: W;
}

const Left: FC<LeftProps> = ({
  pageName,
  setPageName,
  oldPageName,
  width,
  setWidth,
  oldWidth,
}) => {
  useActiveTab({ pageName, oldPageName, width });

  const handleSidebarChange = (value: SidebarPageName) => {
    setPageName((state) => {
      if (!width) setWidth(oldWidth);
      else if (state === value) setWidth(0);

      return value;
    });
  };

  return (
    <Wrapper>
      <Icons>
        <Top>
          {PgView.sidebar.map((page) => (
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
  pageName,
  oldPageName,
  width,
}: Pick<LeftProps<P>, "pageName" | "oldPageName" | "width">) => {
  const theme = useTheme();

  useEffect(() => {
    const oldEl = document.getElementById(getId(oldPageName.current));
    oldEl?.classList.remove(PgView.classNames.ACTIVE);

    const current = width !== 0 ? pageName : "Closed";
    const newEl = document.getElementById(getId(current));
    newEl?.classList.add(PgView.classNames.ACTIVE);

    oldPageName.current = pageName;
  }, [pageName, oldPageName, width, theme.name]);
};

const getId = (id: string) => "sidebar" + id;

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    user-select: none;
    overflow: hidden;

    ${PgTheme.convertToCSS(theme.views.sidebar.left.default)};
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
