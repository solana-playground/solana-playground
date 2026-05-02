import { FC } from "react";
import styled, { css } from "styled-components";

import SidebarButton from "./SidebarButton";
import Settings from "./Settings";
import Link from "../../../../components/Link";
import Popover from "../../../../components/Popover";
import { GITHUB_URL } from "../../../../constants";
import { PgCommon, PgTheme, PgView } from "../../../../utils";

interface LeftProps<P = typeof PgView.sidebar.name, W = number> {
  pageName: P;
  setPageName: (name: P) => void;
  width: W;
}

const Left: FC<LeftProps> = ({ pageName, width, setPageName }) => (
  <Wrapper>
    <Icons>
      <Top>
        {PgView.allSidebarPages.map((page) => (
          <SidebarButton
            key={page.name}
            tooltip={PgCommon.getKeybindTextOS(page.title)}
            src={page.icon}
            onClick={() => setPageName(page.name)}
            active={page.name === pageName && width !== 0}
          />
        ))}
      </Top>

      <Bottom>
        <Link href={GITHUB_URL}>
          <SidebarButton tooltip="GitHub" src="/icons/sidebar/github.png" />
        </Link>

        <Popover popEl={<Settings />} stackingContext="below-modal">
          <SidebarButton
            tooltip="Settings"
            src="/icons/sidebar/settings.webp"
          />
        </Popover>
      </Bottom>
    </Icons>
  </Wrapper>
);

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
