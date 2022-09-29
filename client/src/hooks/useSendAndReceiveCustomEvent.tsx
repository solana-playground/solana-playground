import { useEffect } from "react";

import { PgCommon } from "../utils/pg";

export const useSendAndReceiveCustomEvent = <T,>(
  eventName: string,
  cb: (data: T) => Promise<any>
) => {
  useEffect(() => {
    const eventNames = PgCommon.getSendAndReceiveEventNames(eventName);

    const handleSend = async (e: UIEvent & { detail: T }) => {
      const data = await cb(e.detail);
      PgCommon.createAndDispatchCustomEvent(eventNames.receive, { data });
    };

    document.addEventListener(eventNames.send, handleSend as any);

    return () =>
      document.removeEventListener(eventNames.send, handleSend as any);
  }, [eventName, cb]);
};
