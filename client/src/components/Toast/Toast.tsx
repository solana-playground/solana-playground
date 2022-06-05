import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import { ICONBAR_WIDTH } from "../Panels/Side/Left";
import { ExplorerLink } from "./ExplorerLink";
import { txHashAtom } from "../../state";

const Toast = () => {
  const [txHash] = useAtom(txHashAtom);

  const notify = useCallback(() => {
    if (!txHash) return;
    toast(<ExplorerLink />, { toastId: txHash });
  }, [txHash]);

  useEffect(() => {
    notify();
  }, [notify]);

  if (!txHash) return null;

  return (
    <StyledContainer
      position={toast.POSITION.BOTTOM_LEFT}
      closeOnClick={false}
    />
  );
};

const StyledContainer = styled(ToastContainer)`
  ${({ theme }) => css`
    &&&.Toastify__toast-container {
      left: ${ICONBAR_WIDTH};
      z-index: 1;
    }

    .Toastify__toast {
      background-color: ${theme.colors.toast?.bg ??
      theme.colors.default.bgPrimary};
      border-radius: ${theme.borderRadius};
      color: ${theme.colors.default.textPrimary};
      font-family: ${theme.font?.family};
      font-size: ${theme.font?.size.medium};
    }

    .Toastify__progress-bar {
      background: ${theme.colors.default.primary};
    }

    .Toastify__close-button--light {
      color: ${theme.colors.default.textSecondary};
    }
  `}
`;

export default Toast;
