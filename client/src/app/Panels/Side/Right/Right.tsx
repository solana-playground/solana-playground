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
import { PgTheme, PgView } from "../../../../utils/pg";
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
  // FIXME: Type is `unknown` without the cast
  const props = useRenderOnChange(PgView.onDidChangeSidebarProps) as Record<
    string,
    unknown
  >;
  const loadingCount = useRenderOnChange(PgView.onDidChangeSidebarLoadingCount);

  const [el, setEl] = useState<ReactNode>(null);

  const ids = useRef<boolean[]>([]);
  useAsyncEffect(async () => {
    if (!page) return;

    PgView.setSidebarLoading(true);
    const currentId = ids.current.length;

    try {
      const { default: PageComponent } = await page.importComponent();
      if (!ids.current[currentId + 1]) setEl(<PageComponent {...props} />);
    } catch (e: any) {
      console.log("SIDEBAR ERROR", e.message);
    } finally {
      PgView.setSidebarLoading(false);
    }
  }, [page, props]);

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
