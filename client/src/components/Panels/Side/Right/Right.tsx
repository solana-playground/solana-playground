import {
  FC,
  Suspense,
  lazy,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { Resizable } from "re-resizable";

import { Wormhole } from "../../../Loading";
import { ClassName, Id } from "../../../../constants";
import { TAB_HEIGHT } from "../../Main/Tabs";
import { Sidebar } from "../sidebar-state";
import { PgExplorer, PgShare } from "../../../../utils/pg";
import { explorerAtom } from "../../../../state";

const Explorer = lazy(() => import("./Explorer"));
// const Search = lazy(() => import("./Search"));
const BuildDeploy = lazy(() => import("./BuildDeploy"));
const Test = lazy(() => import("./Test"));

interface DefaultRightProps {
  sidebarState: string;
}

interface RightProps extends DefaultRightProps {
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
}

const Right: FC<RightProps> = ({ sidebarState, width, setWidth }) => {
  const [explorer, setExplorer] = useAtom(explorerAtom);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/") setExplorer(new PgExplorer());
    else {
      const getShare = async () => {
        try {
          const explorerData = await PgShare.get(pathname);

          setExplorer(new PgExplorer(explorerData));
        } catch {
          // Couldn't get the data
          // TODO: Not found page
          // Redirect to main for now
          navigate("/");
        }
      };

      getShare();
    }
  }, [pathname, navigate, setExplorer]);

  useEffect(() => {
    if (explorer) setLoading(false);
  }, [explorer, setLoading]);

  const [height, setHeight] = useState({
    window: document.getElementById(Id.ROOT)?.getClientRects()[0].height ?? 979,
    bottom:
      document.getElementById(Id.BOTTOM)?.getClientRects()[0].height ?? 24,
  });

  // Resize the sidebar on window resize event
  useEffect(() => {
    const handleResize = () => {
      const windowHeight =
        document.getElementById(Id.ROOT)?.getClientRects()[0].height ?? 979;
      const bottomHeight =
        document.getElementById(Id.BOTTOM)?.getClientRects()[0].height ?? 24;

      setHeight({ window: windowHeight, bottom: bottomHeight });
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setHeight]);

  const handleResizeStop = useCallback(
    (e, direction, ref, d) => {
      setWidth((w) => {
        const newWidth = w + d.width;
        if (newWidth < MIN_WIDTH) return 0;

        return newWidth;
      });
    },
    [setWidth]
  );

  return (
    <Resizable
      className={ClassName.SIDE_RIGHT}
      size={{ width, height: "100%" }}
      minHeight="100%"
      maxWidth={window.innerWidth * 0.75}
      enable={{
        top: false,
        right: true,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResizeStop={handleResizeStop}
    >
      <Wrapper windowHeight={height.window} bottomHeight={height.bottom}>
        <StyledTitle sidebarState={sidebarState} />
        <Suspense fallback={<RightLoading />}>
          {loading ? <RightLoading /> : <Inside sidebarState={sidebarState} />}
        </Suspense>
      </Wrapper>
    </Resizable>
  );
};

const Inside: FC<DefaultRightProps> = ({ sidebarState }) => {
  switch (sidebarState) {
    case Sidebar.EXPLORER:
      return <Explorer />;
    // case Sidebar.SEARCH:
    //   return <Search />;
    case Sidebar.BUILD_DEPLOY:
      return <BuildDeploy />;
    case Sidebar.TEST:
      return <Test />;
    default:
      return null;
  }
};

interface TitleProps extends DefaultRightProps {
  className?: string;
}

const Title: FC<TitleProps> = ({ sidebarState, className }) => (
  <div className={className}>
    <span>{sidebarState.toUpperCase()}</span>
  </div>
);

export const RightLoading = () => (
  <LoadingWrapper>
    <Wormhole />
  </LoadingWrapper>
);

const MIN_WIDTH = 180;

const Wrapper = styled.div<{ windowHeight?: number; bottomHeight?: number }>`
  ${({ theme, windowHeight, bottomHeight }) => css`
    display: flex;
    flex-direction: column;
    height: ${windowHeight && bottomHeight
      ? windowHeight - bottomHeight
      : 955}px;
    overflow-y: auto;
    background-color: ${theme.colors?.right?.bg ?? "inherit"};
    border-right: 1px solid ${theme.colors.default.borderColor};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      width: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.colors.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.colors.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.colors.scrollbar?.thumb.color};
    }
  `}
`;

const StyledTitle = styled(Title)`
  min-height: ${TAB_HEIGHT};
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

export const LoadingWrapper = styled.div`
  margin-top: 2rem;
`;

export default Right;
