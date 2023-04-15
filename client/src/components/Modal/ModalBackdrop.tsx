import { ComponentType, useEffect } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import useModal from "./useModal";
import { modalAtom } from "../../state";
import { PgCommon } from "../../utils/pg";
import { EventName } from "../../constants";
import { useOnKey } from "../../hooks";
import { PgThemeManager } from "../../utils/pg/theme";

const ModalBackdrop = () => {
  const [modal, setModal] = useAtom(modalAtom);

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
      El ? setModal(<El {...e.detail.props} />) : close();
    };

    document.addEventListener(eventName, handleModalSet as EventListener);

    return () => {
      document.removeEventListener(eventName, handleModalSet as EventListener);
    };
  }, [setModal, close]);

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
