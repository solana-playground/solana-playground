import { useCallback } from "react";

import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";

export const useExposeGetClassAsStatic = <T,>(
  classObject: T,
  eventName: string
) => {
  const cb = useCallback(async () => classObject, [classObject]);
  useSendAndReceiveCustomEvent<T>(cb, eventName);
};
