import { lazy, Suspense } from "react";
import styled from "styled-components";

import Side from "./Side";
import { Wormhole } from "../../../components/Loading";

const Main = lazy(() => import("./Main"));
const Bottom = lazy(() => import("./Bottom"));
const Wallet = lazy(() => import("../../../components/Wallet"));
const Toast = lazy(() => import("../../../components/Toast"));

const Panels = () => (
  <Wrapper>
    <MainWrapper>
      <Side />
      <Suspense fallback={<Wormhole size={10} circleCount={10} />}>
        <Main />
        <Wallet />
      </Suspense>
    </MainWrapper>
    <Suspense fallback={false}>
      <Bottom />
      <Toast />
    </Suspense>
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

export default Panels;
