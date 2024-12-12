import {
  FC,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";
import styled, { css } from "styled-components";

import ErrorBoundary from "../../../../../components/ErrorBoundary";
import Resizable from "../../../../../components/Resizable";
import { Wormhole } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import {
  NullableJSX,
  PgTheme,
  PgView,
  SetState,
} from "../../../../../utils/pg";
import { useResize } from "./useResize";
import { useSetStatic } from "../../../../../hooks";

interface DefaultRightProps {
  page: SidebarPage;
}

interface RightProps<W = number> extends DefaultRightProps {
  width: W;
  setWidth: Dispatch<SetStateAction<W>>;
  oldWidth: W;
}

const Right: FC<RightProps> = ({ page, width, setWidth, oldWidth }) => {
  const { handleResizeStop, windowHeight } = useResize(setWidth);

  return (
    <Resizable
      size={{ width, height: "100%" }}
      minHeight="100%"
      maxWidth={window.innerWidth * 0.75}
      onResizeStop={handleResizeStop}
      enable="right"
    >
      <Wrapper width={width} oldWidth={oldWidth} windowHeight={windowHeight}>
        <Title page={page} />
        <Content page={page} />
      </Wrapper>
    </Resizable>
  );
};

const Title: FC<DefaultRightProps> = ({ page }) => (
  <TitleWrapper>{page.name.toUpperCase()}</TitleWrapper>
);

const Content: FC<DefaultRightProps> = ({ page }) => {
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
        const { default: PageComponent } = await page.importElement();
        if (ids[currentId + 1] === undefined) setEl(<PageComponent />);
      } catch (e: any) {
        console.log("SIDEBAR ERROR", e.message);
      } finally {
        setLoading(false);
      }
    });
    return dispose;
  }, [setLoading]);

  if (loadingCount) return <Loading page={page} />;

  return <ErrorBoundary>{el}</ErrorBoundary>;
};

const Wrapper = styled.div<{
  windowHeight: number;
  width: number;
  oldWidth: number;
}>`
  ${({ theme, width, oldWidth, windowHeight }) => css`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: calc(${windowHeight}px - ${theme.components.bottom.default.height});
    min-width: ${width ? width : oldWidth}px;

    ${PgTheme.getScrollbarCSS()};
    ${PgTheme.convertToCSS(theme.components.sidebar.right.default)};
  `}
`;

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;

    ${PgTheme.convertToCSS(theme.components.sidebar.right.title)};
  `}
`;

const Loading: FC<DefaultRightProps> = ({ page }) => {
  if (page.LoadingElement) return <page.LoadingElement />;

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
