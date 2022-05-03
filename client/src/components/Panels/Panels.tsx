import { lazy, Suspense } from "react";
import styled, { css } from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import Loading from "../Loading";
import Side from "./Side";
import Noti from "./Noti";
import { ICONBAR_WIDTH } from "./Side/Left/Left";

const Main = lazy(() => import("./Main"));
const Bottom = lazy(() => import("./Bottom"));

const Panels = () => {
  return (
    <Wrapper>
      <Noti />
      <MainWrapper>
        <Side />
        <Suspense fallback={<Loading size={10} circleCount={10} />}>
          <Main />
        </Suspense>
      </MainWrapper>
      <Suspense fallback={false}>
        <Bottom />
        <StyledContainer position={toast.POSITION.BOTTOM_LEFT} />
      </Suspense>
    </Wrapper>
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
  grid-template-columns: 23fr 97fr;
  overflow: hidden;
  width: 100%;
  flex: 1;
`;

const StyledContainer = styled(ToastContainer)`
  ${({ theme }) => css`
    &&&.Toastify__toast-container {
      left: ${ICONBAR_WIDTH};
      z-index: 1;
    }
    .Toastify__toast {
      background-color: ${theme.colors.toast?.bg ?? theme.colors.default.bg};
      color: ${theme.colors.default.textPrimary};
      border-radius: ${theme.borderRadius};
    }
    .Toastify__toast-body {
    }
    .Toastify__progress-bar {
      background: ${theme.colors.default.primary};
    }
  `}
`;

export default Panels;
