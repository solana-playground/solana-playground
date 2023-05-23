import { useCallback } from "react";
import styled, { css } from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import { EventName } from "../../constants";
import { PgThemeManager } from "../../utils/pg/theme";
import { useSetStatic } from "../../hooks";

const Toast = () => {
  const setToast = useCallback(({ Component, props }) => {
    if (typeof Component === "function") {
      Component = <Component {...props?.componentProps} />;
    }

    toast(Component, props?.options);
  }, []);

  useSetStatic(setToast, EventName.TOAST_SET);

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
