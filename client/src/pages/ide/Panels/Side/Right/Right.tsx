import {
  FC,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";
import styled, { css } from "styled-components";
import { Resizable } from "re-resizable";

import ErrorBoundary from "../../../../../components/ErrorBoundary";
import { Wormhole } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import {
  NullableJSX,
  PgTheme,
  PgView,
  SetState,
} from "../../../../../utils/pg";
import { useResize } from "./useResize";
import { SIDEBAR } from "../../../../../views/sidebar";
import { useSetStatic } from "../../../../../hooks";

interface DefaultRightProps {
  sidebarPage: SidebarPageName;
}

interface RightProps<W = number> extends DefaultRightProps {
  width: W;
  setWidth: Dispatch<SetStateAction<W>>;
}

const Right: FC<RightProps> = ({ sidebarPage, width, setWidth }) => {
  const { handleResizeStop, windowHeight } = useResize(setWidth);

  return (
    <Resizable
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
      <Wrapper windowHeight={windowHeight}>
        <Title sidebarPage={sidebarPage} />
        <Content sidebarPage={sidebarPage} />
      </Wrapper>
    </Resizable>
  );
};

const Title: FC<DefaultRightProps> = ({ sidebarPage }) => (
  <TitleWrapper>{sidebarPage.toUpperCase()}</TitleWrapper>
);

const Content: FC<DefaultRightProps> = ({ sidebarPage }) => {
  const [el, setEl] = useState<NullableJSX>(null);
  const [loadingCount, setLoadingCount] = useState<number>(0);

  // There could be multiple processes that change the loading state and the
  // overall loading state should only be disabled when all processes complete.
  const setLoading = useCallback((set: SetState<boolean>) => {
    setLoadingCount((prev) => {
      const val = typeof set === "function" ? set(!!prev) : set;
      return val ? prev + 1 : prev - 1;
    });
  }, []);

  useSetStatic(setLoading, EventName.VIEW_SIDEBAR_LOADING_SET);

  useEffect(() => {
    const ids: boolean[] = [];

    const { dispose } = PgView.onDidChangeSidebarPage(async (page) => {
      setLoading(true);

      const currentId = ids.length;
      ids[currentId] ??= false;

      try {
        const { importElement } = SIDEBAR.find((s) => s.name === page)!;
        const { default: PageComponent } = await importElement();
        if (ids[currentId + 1] === undefined) setEl(<PageComponent />);
      } catch (e: any) {
        console.log("SIDEBAR ERROR", e.message);
      } finally {
        setLoading(false);
      }
    });
    return () => dispose();
  }, [setLoading]);

  if (loadingCount) return <Loading sidebarPage={sidebarPage} />;

  return <ErrorBoundary>{el}</ErrorBoundary>;
};

const Wrapper = styled.div<{ windowHeight: number }>`
  ${({ theme, windowHeight }) => css`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: calc(${windowHeight}px - ${theme.components.bottom.default.height});

    ${PgTheme.getScrollbarCSS()};
    ${PgTheme.convertToCSS(theme.components.sidebar.right.default)};
  `}
`;

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: ${theme.components.tabs.tab.default.height};

    ${PgTheme.convertToCSS(theme.components.sidebar.right.title)};
  `}
`;

const Loading: FC<DefaultRightProps> = ({ sidebarPage }) => {
  const LoadingElement = SIDEBAR.find(
    (p) => p.name === sidebarPage
  )!.LoadingElement;

  if (LoadingElement) return <LoadingElement />;

  return (
    <LoadingWrapper>
      <Wormhole />
    </LoadingWrapper>
  );
};

const LoadingWrapper = styled.div`
  margin-top: 2rem;
`;

export default Right;
