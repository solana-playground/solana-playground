import { useCallback } from "react";
import styled, { css } from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import { EventName } from "../../constants";
import { PgCommon, PgTheme } from "../../utils/pg";
import { useSetStatic } from "../../hooks";

export interface ToastChildProps {
  id: number;
}

const Toast = () => {
  const setToast = useCallback(({ Component, props }) => {
    const id = PgCommon.generateRandomInt(0, 2 ** 12);
    if (typeof Component === "function") {
      Component = <Component {...props?.componentProps} id={id} />;
    }

    toast(Component, { ...props?.options, toastId: id });
  }, []);

  useSetStatic(setToast, EventName.TOAST_SET);
  useSetStatic(toast.dismiss, EventName.TOAST_CLOSE);

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
    }

    .Toastify__toast {
      ${PgTheme.convertToCSS(theme.components.toast.default)};
    }

    .Toastify__progress-bar {
      ${PgTheme.convertToCSS(theme.components.toast.progress)};
    }

    .Toastify__close-button--light {
      ${PgTheme.convertToCSS(theme.components.toast.closeButton)};
    }
  `}
`;

export default Toast;
