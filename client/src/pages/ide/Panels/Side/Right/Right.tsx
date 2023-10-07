import { FC, Dispatch, SetStateAction, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { Resizable } from "re-resizable";

import { Wormhole } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import { NullableJSX, PgTheme, PgView } from "../../../../../utils/pg";
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

const Content: FC<DefaultRightProps> = ({ sidebarPage }) => {
  const [El, setEl] = useState<NullableJSX>(null);
  const [loading, setLoading] = useState(true);

  useSetStatic(setLoading, EventName.VIEW_SIDEBAR_LOADING_SET);

  useEffect(() => {
    const ids: boolean[] = [];

    const { dispose } = PgView.onDidChangeSidebarPage(async (page) => {
      const currentId = ids.length;
      const nextId = currentId + 1;
      ids[currentId] ??= false;

      setLoading(true);

      try {
        const { importElement } = SIDEBAR.find((s) => s.name === page)!;

        const { default: PageComponent } = await importElement();
        if (ids[nextId] !== undefined) return;

        setEl(<PageComponent />);
      } catch (e: any) {
        console.log("SIDEBAR ERROR", e.message);
      }

      setLoading(false);
    });
    return () => dispose();
  }, []);

  if (loading) return <Loading sidebarPage={sidebarPage} />;

  return El;
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

const Title: FC<DefaultRightProps> = ({ sidebarPage }) => (
  <TitleWrapper>
    <span>{sidebarPage.toUpperCase()}</span>
  </TitleWrapper>
);

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
