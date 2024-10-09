import styled from "styled-components";

import Bottom from "./Bottom";
import Main from "./Main";
import Side from "./Side";
import Delayed from "../../../components/Delayed";
import ModalBackdrop from "../../../components/ModalBackdrop";
import Toast from "../../../components/Toast";
import Wallet from "../../../components/Wallet";
import { Id } from "../../../constants";

const Panels = () => (
  <Wrapper>
    <TopWrapper>
      <Side />
      <Main />
    </TopWrapper>

    <Bottom />

    {/* Add a delay to the mount of the `Wallet` component because some of the
    globals used in that component doesn't get initialized in time */}
    <Delayed delay={10}>
      <Wallet />
    </Delayed>

    {/* A portal that is *above* the modal backdrop stacking context */}
    <PortalAbove id={Id.PORTAL_ABOVE} />

    <ModalBackdrop />

    {/* A portal that is *below* the modal backdrop stacking context */}
    <PortalBelow id={Id.PORTAL_BELOW}>
      <Toast />
    </PortalBelow>
  </Wrapper>
);

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const TopWrapper = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  overflow: hidden;
  width: 100%;
  flex: 1;
`;

const PortalAbove = styled.div`
  z-index: 4;
`;

const PortalBelow = styled.div`
  z-index: 2;
`;

export default Panels;
