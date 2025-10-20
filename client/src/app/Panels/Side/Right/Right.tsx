import {
  FC,
  Dispatch,
  SetStateAction,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import styled, { css } from "styled-components";

import ErrorBoundary from "../../../../components/ErrorBoundary";
import Resizable from "../../../../components/Resizable";
import { Wormhole } from "../../../../components/Loading";
import { PgTheme, PgView, SetState, SidebarPage } from "../../../../utils/pg";
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
  const handleResizeStop = useCallback(
    (e, direction, ref, d) => {
      setWidth((w) => {
        const newWidth = w + d.width;
        if (newWidth < 180) return 0;

        return newWidth;
      });
    },
    [setWidth]
  );

  return (
    <Resizable
      size={{ width, height: "100%" }}
      maxWidth={window.innerWidth * 0.75}
      onResizeStop={handleResizeStop}
      enable="right"
    >
      <Wrapper width={width} oldWidth={oldWidth}>
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
  const [el, setEl] = useState<ReactNode>(null);
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

  useSetStatic(PgView.events.SIDEBAR_PAGE_PROPS_SET, setProps);
  useSetStatic(PgView.events.SIDEBAR_LOADING_SET, setLoading);

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

  return (
    <ErrorBoundary>
      <ContentWrapper>{el}</ContentWrapper>
    </ErrorBoundary>
  );
};

const Wrapper = styled.div<{
  width: number;
  oldWidth: number;
}>`
  ${({ theme, width, oldWidth }) => css`
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: ${width ? width : oldWidth}px;

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

const ContentWrapper = styled.div`
  ${({ theme }) => css`
    height: 100%;
    overflow-y: auto;

    ${PgTheme.getScrollbarCSS()};
    ${PgTheme.convertToCSS(theme.views.sidebar.right.content)};
  `}
`;

const Loading: FC<DefaultRightProps> = ({ page }) => {
  if (page.LoadingComponent) return <page.LoadingComponent />;

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
