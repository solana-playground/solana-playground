import { lazy, Suspense, useEffect, useState } from "react";
import styled from "styled-components";

import Side from "./Side";
import { Wormhole } from "../../../components/Loading";

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

    <DelayedBottomAndWallet />

    <Suspense fallback={null}>
      <Toast />
      <ModalBackdrop />
    </Suspense>
  </Wrapper>
);

/**
 * Add a delay to the mount of `Bottom` and `Wallet` components because some of
 * the globals used in that component doesn't become initialized until the next
 * even loop on Firefox.
 */
const DelayedBottomAndWallet = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShow(true));
    return () => clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <Suspense fallback={null}>
      <Bottom />
      <Wallet />
    </Suspense>
  );
};

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
