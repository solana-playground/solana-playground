import { DependencyList, useEffect } from "react";

import { PgCommon } from "../utils/pg/common";

export const useSendAndReceiveCustomEvent = <T,>(
  eventName: string,
  cb: (data: T) => Promise<any>,
  deps?: DependencyList
) => {
  useEffect(() => {
    const eventNames = PgCommon.getSendAndReceiveEventNames(eventName);

    const handleSend = async (e: UIEvent & { detail: T }) => {
      try {
        const data = await cb(e.detail);
        PgCommon.createAndDispatchCustomEvent(eventNames.receive, { data });
      } catch (e: any) {
        PgCommon.createAndDispatchCustomEvent(eventNames.receive, {
          error: e.message,
        });
      }
    };

    document.addEventListener(eventNames.send, handleSend as any);

    return () => {
      document.removeEventListener(eventNames.send, handleSend as any);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? [eventName, cb]);
};
