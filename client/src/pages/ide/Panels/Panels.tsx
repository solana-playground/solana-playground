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
    <MainWrapper>
      <Side />
      <Main />
    </MainWrapper>

    {/* Add a delay to the mount of `Bottom` and `Wallet` components because
    some of the globals used in those component doesn't get initialized */}
    <Delayed delay={10}>
      <Bottom />
      <Wallet />
    </Delayed>

    <Toast />
    <ModalBackdrop />

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
