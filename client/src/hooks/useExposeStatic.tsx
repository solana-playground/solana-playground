import { useCallback, useMemo } from "react";

import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";
import { PgCommon } from "../utils/common";
import type { Methods } from "../utils";

/**
 * Expose the given class object inside a component to outside, allowing it to
 * be used anywhere.
 *
 * This hook should be used with {@link PgCommon.sendAndReceiveCustomEvent}.
 * For example, to get the object statically:
 *
 * ```ts
 * const classObject = await PgCommon.sendAndReceiveCustomEvent<Type>(
 *   PgCommon.getStaticEventNames(eventName).get
 * );
 * ```
 *
 * @param eventName event name to derive from
 * @param classObject object to expose
 */
export const useExposeStatic = (
  eventName: string,
  classObject: { [key: string]: any } | null
) => {
  const eventNames = useMemo(
    () => PgCommon.getStaticEventNames(eventName),
    [eventName]
  );
  useExposeGetClassAsStatic(eventNames.get, classObject);
  useExposeMethodsAsStatic(eventNames.run, classObject);
};

const useExposeGetClassAsStatic = <T,>(eventName: string, classObject: T) => {
  const cb = useCallback(async () => classObject, [classObject]);
  useSendAndReceiveCustomEvent<T>(eventName, cb);
};

const useExposeMethodsAsStatic = <T,>(
  eventName: string,
  classObject: { [key: string]: any } | null
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
