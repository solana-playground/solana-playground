import { lazy, Suspense } from "react";
import styled from "styled-components";

import Side from "./Side";
import Delayed from "../../../components/Delayed";
import { Wormhole } from "../../../components/Loading";
import { Id } from "../../../constants";

const Main = lazy(() => import("./Main"));
const Bottom = lazy(() => import("./Bottom"));
const Wallet = lazy(() => import("../../../components/Wallet"));
const Toast = lazy(() => import("../../../components/Toast"));
const ModalBackdrop = lazy(() => import("../../../components/ModalBackdrop"));

const Panels = () => (
  <Wrapper>
    <MainWrapper>
      <Side />
      <Suspense fallback={<Wormhole size={10} circleCount={10} />}>
        <Main />
      </Suspense>
    </MainWrapper>

    {/* Add a delay to the mount of `Bottom` and `Wallet` components because
    some of  the globals used in that component doesn't become initialized until
    the next even loop on Firefox */}
    <Delayed>
      <Suspense fallback={null}>
        <Bottom />
        <Wallet />
      </Suspense>
    </Delayed>

    <Suspense fallback={null}>
      <Toast />
      <ModalBackdrop />
    </Suspense>

    {/* Context menu portal helps to make the menu always appear on top of the
    other elements */}
    <ContextMenuPortal id={Id.CTX_MENU} />
  </Wrapper>
);

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainWrapper = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  overflow: hidden;
  width: 100%;
  flex: 1;
`;

const ContextMenuPortal = styled.div``;

export default Panels;
