import { Dispatch, SetStateAction, useMemo } from "react";

import { PgCommon } from "../utils/common";
import { useGetStatic } from "./useGetStatic";
import { useSetStatic } from "./useSetStatic";

export const useGetAndSetStatic = <T,>(
  eventName: string,
  get: T,
  set: Dispatch<SetStateAction<T>>
) => {
  const eventNames = useMemo(
    () => PgCommon.getStaticStateEventNames(eventName),
    [eventName]
  );
  useGetStatic(eventNames.get, get);
  useSetStatic(eventNames.set, set);
};
