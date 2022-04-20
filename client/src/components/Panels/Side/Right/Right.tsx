import { FC, Suspense, lazy } from "react";
import styled, { css } from "styled-components";

import { TAB_HEIGHT } from "../../Main/Tabs/Tabs";
import { Sidebar } from "../sidebar-values";

const Explorer = lazy(() => import("./Explorer"));
// const Search = lazy(() => import("./Search"));
const Build = lazy(() => import("./Build"));
const Deploy = lazy(() => import("./Deploy"));
const Test = lazy(() => import("./Test"));

interface RightProps {
  sidebarState: string;
}

const Right: FC<RightProps> = ({ sidebarState }) => (
  <Wrapper>
    <StyledTitle sidebarState={sidebarState} />
    <Suspense fallback={<></>}>
      <Inside sidebarState={sidebarState} />
    </Suspense>
  </Wrapper>
);

const Inside: FC<RightProps> = ({ sidebarState }) => {
  switch (sidebarState) {
    case Sidebar.EXPLORER:
      return <Explorer />;
    // case Sidebar.SEARCH:
    //   return <Search />;
    case Sidebar.BUILD:
      return <Build />;
    case Sidebar.DEPLOY:
      return <Deploy />;
    case Sidebar.TEST:
      return <Test />;
    default:
      return null;
  }
};

interface TitleProps extends RightProps {
  className?: string;
}

const Title: FC<TitleProps> = ({ sidebarState, className }) => (
  <div className={className}>
    <span>{sidebarState.toUpperCase()}</span>
  </div>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    width: 20rem;
    height: 100%;
    background-color: ${theme.colors?.right?.bg ?? "inherit"};
    border-left: 1px solid ${theme.colors.default.borderColor};
    border-right: 1px solid ${theme.colors.default.borderColor};
  `}
`;

const StyledTitle = styled(Title)`
  height: ${TAB_HEIGHT};
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

export default Right;
