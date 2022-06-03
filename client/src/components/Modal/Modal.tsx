import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { modalAtom } from "../../state";

const Modal = () => {
  const [modal, setModal] = useAtom(modalAtom);

  // Close modal on ESC
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
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
