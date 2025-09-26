import { ReactElement, useCallback, useState } from "react";
import styled, { css } from "styled-components";

import { PgCommon, PgTheme, PgView } from "../../utils/pg";
import { useKeybind, useSetStatic } from "../../hooks";

const ModalBackdrop = () => {
  const [modals, setModals] = useState<ReactElement[]>([]);

  const setModalStatic = useCallback(({ elementable, props }) => {
    // Treat `null` as close
    if (elementable === null) {
      setModals((modals) => modals.slice(0, -1));
      return;
    }

    elementable = PgView.normalizeElement(elementable, props);
    setModals((modals) => [...modals, elementable]);
  }, []);

  useSetStatic(
    PgCommon.getSendAndReceiveEventNames(PgView.events.MODAL_SET).send,
    setModalStatic
  );

  // Close modal on ESC
  useKeybind("Escape", PgView.closeModal);

  return modals.length ? <Wrapper>{modals.at(-1)}</Wrapper> : null;
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
    z-index: 3;

    ${PgTheme.convertToCSS(theme.components.modal.backdrop)};
  `}
`;

export default ModalBackdrop;
