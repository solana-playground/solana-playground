import { useCallback, useMemo } from "react";

import { useSendAndReceiveCustomEvent } from "./useSendAndReceiveCustomEvent";
import { PgCommon } from "../utils/pg/common";
import type { Methods } from "../utils/pg";

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
 * @param classObject object to expose
 * @param eventName event name to derive from
 */
export const useExposeStatic = (
  classObject: { [key: string]: any } | null,
  eventName: string
) => {
  const eventNames = useMemo(
    () => PgCommon.getStaticEventNames(eventName),
    [eventName]
  );
  useExposeGetClassAsStatic(classObject, eventNames.get);
  useExposeMethodsAsStatic(classObject, eventNames.run);
};

const useExposeGetClassAsStatic = <T,>(classObject: T, eventName: string) => {
  const cb = useCallback(async () => classObject, [classObject]);
  useSendAndReceiveCustomEvent<T>(eventName, cb);
};

const useExposeMethodsAsStatic = <T,>(
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
