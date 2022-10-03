import { ComponentType, useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { modalAtom } from "../../state";
import { PgCommon } from "../../utils/pg";
import { EventName } from "../../constants";

const Modal = () => {
  const [modal, setModal] = useAtom(modalAtom);

  // Events
  useEffect(() => {
    const eventName = PgCommon.getSendAndReceiveEventNames(
      EventName.MODAL_SET
    ).send;

    // Set modal from custom event
    const handleModalSet = (e: UIEvent & { detail: { el: ComponentType } }) => {
      const El = e.detail.el;
      setModal(El ? <El /> : null);
    };

    // Close modal on ESC
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };

    document.addEventListener(eventName, handleModalSet as EventListener);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener(eventName, handleModalSet as EventListener);
      document.removeEventListener("keydown", handleKey);
    };
  }, [setModal]);

  return modal ? <Wrapper>{modal}</Wrapper> : null;
};

const Wrapper = styled.div`
  position: absolute;
  width: 100vw;
  height: 100vh;
  background-color: #00000064;
  display: flex;
  justify-content: center;
  align-items: center;
  inset: 0;
`;

export default Modal;
