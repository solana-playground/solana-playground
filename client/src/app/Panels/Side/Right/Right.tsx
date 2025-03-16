import {
  FC,
  Dispatch,
  SetStateAction,
  useState,
  useCallback,
  useRef,
} from "react";
import styled, { css } from "styled-components";

import ErrorBoundary from "../../../../components/ErrorBoundary";
import Resizable from "../../../../components/Resizable";
import { Wormhole } from "../../../../components/Loading";
import {
  NullableJSX,
  PgTheme,
  PgView,
  SetState,
  SidebarPage,
} from "../../../../utils/pg";
import { useResize } from "./useResize";
import { useAsyncEffect, useSetStatic } from "../../../../hooks";

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
  const [props, setProps] = useState(() => ({}));
  const [loadingCount, setLoadingCount] = useState<number>(0);

  // There could be multiple processes that change the loading state and the
  // overall loading state should only be disabled when all processes complete.
  const setLoading = useCallback((set: SetState<boolean>) => {
    setLoadingCount((prev) => {
      const val = typeof set === "function" ? set(!!prev) : set;
      return val ? prev + 1 : prev - 1;
    });
  }, []);

  useSetStatic(setProps, PgView.events.SIDEBAR_PAGE_PROPS_SET);
  useSetStatic(setLoading, PgView.events.SIDEBAR_LOADING_SET);

  const ids = useRef<boolean[]>([]);

  useAsyncEffect(async () => {
    setLoading(true);
    const currentId = ids.current.length;

    try {
      const { default: PageComponent } = await page.importComponent();
      if (!ids.current[currentId + 1]) setEl(<PageComponent {...props} />);
    } catch (e: any) {
      console.log("SIDEBAR ERROR", e.message);
    } finally {
      setLoading(false);
    }
  }, [page, props, setLoading]);

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
    height: calc(${windowHeight}px - ${theme.views.bottom.default.height});
    min-width: ${width ? width : oldWidth}px;

    ${PgTheme.getScrollbarCSS()};
    ${PgTheme.convertToCSS(theme.views.sidebar.right.default)};
  `}
`;

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;

    ${PgTheme.convertToCSS(theme.views.sidebar.right.title)};
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
