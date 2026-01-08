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
import { PgCommon, PgTheme, PgView } from "../../../../utils/pg";
import { useAsyncEffect, useRenderOnChange } from "../../../../hooks";

interface DefaultRightProps {
  page: typeof PgView.currentSidebarPage;
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
  <TitleWrapper>{page ? page.name.toUpperCase() : ""}</TitleWrapper>
);

const Content: FC<DefaultRightProps> = ({ page }) => {
  const props = useRenderOnChange(PgView.onDidChangeSidebarProps);
  const loadingCount = useRenderOnChange(PgView.onDidChangeSidebarLoadingCount);

  const [el, setEl] = useState<ReactNode>(null);

  const ids = useRef<boolean[]>([]);
  useAsyncEffect(async () => {
    if (!page) return;

    const currentId = ids.current.length;
    ids.current[currentId] ??= true;

    const setContent = async () => {
      const [{ default: Page }, resolvedProps] = await Promise.all([
        page.importComponent(),
        PgCommon.callIfNeeded(props),
      ]);
      if (!ids.current[currentId + 1]) setEl(<Page {...resolvedProps} />);
    };

    try {
      PgView.setSidebarLoading(true);
      await setContent();
    } catch (e) {
      setEl({ error: e, refresh: setContent });
    } finally {
      PgView.setSidebarLoading(false);
    }
  }, [page, props]);

  if (
    loadingCount ||
    !el ||
    !page ||
    (page.route &&
      (el as { props?: Record<string, any> }).props &&
      page.name !== (el as { props: { pageName?: string } }).props.pageName)
  ) {
    return <Loading page={page} />;
  }

  return (
    <ContentWrapper>
      <ErrorBoundary>{el}</ErrorBoundary>
    </ContentWrapper>
  );
};

const Wrapper = styled.div<{
  width: number;
  oldWidth: number;
}>`
  ${({ theme, width, oldWidth }) => css`
    display: flex;
    flex-direction: column;
    height: calc(100vh - ${PgTheme.theme.views.bottom.default.height});
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
  if (page?.LoadingComponent) return <page.LoadingComponent />;

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
