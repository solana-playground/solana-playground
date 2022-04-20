import { useCallback } from "react";
import { useAtom } from "jotai";

import { modalAtom } from "../../state";

const useModal = () => {
  const [, setModal] = useAtom(modalAtom);

  const close = useCallback(() => {
    setModal({ show: false });
  }, [setModal]);

  return { close };
};

export default useModal;
