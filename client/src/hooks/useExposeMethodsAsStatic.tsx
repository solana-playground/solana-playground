import { useCallback } from "react";

import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";
import type { Methods } from "../utils/pg";

export const useExposeMethodsAsStatic = <T,>(
  classObject: { [key: string]: any } | null,
  eventName: string
) => {
  const cb = useCallback(
    async (data) => {
      if (!classObject) return;

      const methodName = Object.keys(data)[0];
      if (!classObject[methodName]?.call) return classObject[methodName];

      return await classObject[methodName](...data[methodName]);
    },
    [classObject]
  );

  useSendAndReceiveCustomEvent<
    Methods<T> extends { [key: string]: any } ? Methods<T> : never
  >(eventName, cb);
};
