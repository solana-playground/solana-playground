import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import { ExplorerLink } from "./ExplorerLink";
import { txHashAtom } from "../../state";
import { PgPlaynet } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";

const Toast = () => {
  const [txHash] = useAtom(txHashAtom);

  const notify = useCallback(() => {
    if (!txHash) return;

    // Don't show on Playnet
    if (PgPlaynet.isUrlPlaynet()) return;

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
      left: ${theme.components.sidebar.left.default.width};
      z-index: 1;
    }

    .Toastify__toast {
      ${PgThemeManager.convertToCSS(theme.components.toast.default)};
    }

    .Toastify__progress-bar {
      ${PgThemeManager.convertToCSS(theme.components.toast.progress)};
    }

    .Toastify__close-button--light {
      ${PgThemeManager.convertToCSS(theme.components.toast.closeButton)};
    }
  `}
`;

export default Toast;
