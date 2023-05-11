import { useCallback } from "react";

import { EventName } from "../../constants";
import { PgCommon, PgView } from "../../utils/pg";

const useModal = () => {
  const close = useCallback((data?: any) => {
    // Data will be a `ClickEvent` if the modal has been closed with the default
    // cancel button
    if (data?.target) {
      data = null;
    }
    PgCommon.createAndDispatchCustomEvent(
      PgCommon.getSendAndReceiveEventNames(EventName.MODAL_SET).receive,
      { data }
    );

    PgView.setModal(null);
  }, []);

  return { close };
};

export default useModal;
