import { useCallback } from "react";

import { PgMethod } from "../utils/pg";
import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";

export const useExposeStatic = <T,>(
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
    PgMethod<T> extends { [key: string]: any } ? PgMethod<T> : never
  >(eventName, cb);
};
