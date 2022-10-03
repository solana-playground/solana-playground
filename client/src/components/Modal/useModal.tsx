import { useCallback } from "react";
import { useAtom } from "jotai";

import { modalAtom } from "../../state";
import { PgCommon } from "../../utils/pg";
import { EventName } from "../../constants";

const useModal = () => {
  const [, setModal] = useAtom(modalAtom);

  const close = useCallback(
    (data?: any) => {
      // It will be a ClickEvent if the modal has been closed with the default cancel button
      if (data?.target) {
        data = null;
      }
      setModal(null);

      PgCommon.createAndDispatchCustomEvent(
        PgCommon.getSendAndReceiveEventNames(EventName.MODAL_SET).receive,
        { data }
      );
    },
    [setModal]
  );

  return { close };
};

export default useModal;
