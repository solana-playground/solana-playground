import { ComponentType, ReactElement, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import useModal from "./useModal";
import { EventName } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";
import { useOnKey } from "../../hooks";

const ModalBackdrop = () => {
  const [modal, setModal] = useState<ReactElement | null>(null);

  const { close } = useModal();

  // Events
  useEffect(() => {
    const eventName = PgCommon.getSendAndReceiveEventNames(
      EventName.MODAL_SET
    ).send;

    // Set modal from custom event
    const handleModalSet = (
      e: UIEvent & { detail: { el: ComponentType; props: object } }
    ) => {
      const El = e.detail.el;
      setModal(El ? <El {...e.detail.props} /> : null);
    };

    document.addEventListener(eventName, handleModalSet as EventListener);

    return () => {
      document.removeEventListener(eventName, handleModalSet as EventListener);
    };
  }, []);

  // Close modal on ESC
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

    ${PgThemeManager.convertToCSS(theme.components.modal.backdrop)};
  `}
`;

export default ModalBackdrop;
