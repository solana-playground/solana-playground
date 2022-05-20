import { useCallback } from "react";
import { useAtom } from "jotai";

import { modalAtom } from "../../state";

const useModal = () => {
  const [, setModal] = useAtom(modalAtom);

  const close = useCallback(() => {
    setModal(null);
  }, [setModal]);

  return { close };
};

export default useModal;
