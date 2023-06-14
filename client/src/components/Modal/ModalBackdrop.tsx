import { ReactElement, useCallback, useState } from "react";
import styled, { css } from "styled-components";

import useModal from "./useModal";
import { EventName } from "../../constants";
import { PgCommon, PgTheme } from "../../utils/pg";
import { useOnKey, useSetStatic } from "../../hooks";

const ModalBackdrop = () => {
  const [modal, setModal] = useState<ReactElement | null>(null);

  const setModalStatic = useCallback(({ Component, props }) => {
    if (typeof Component === "function") {
      Component = <Component {...props} />;
    }

    setModal(Component);
  }, []);

  useSetStatic(
    setModalStatic,
    PgCommon.getSendAndReceiveEventNames(EventName.MODAL_SET).send
  );

  // Close modal on ESC
  const { close } = useModal();
  useOnKey("Escape", close);

  return modal ? <Wrapper>{modal}</Wrapper> : null;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: absolute;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;

    ${PgTheme.convertToCSS(theme.components.modal.backdrop)};
  `}
`;

export default ModalBackdrop;
