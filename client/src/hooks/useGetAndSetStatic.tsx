import { Dispatch, SetStateAction, useMemo } from "react";

import { PgCommon } from "../utils/pg/common";
import { useGetStatic } from "./useGetStatic";
import { useSetStatic } from "./useSetStatic";

export const useGetAndSetStatic = <T,>(
  get: T,
  set: Dispatch<SetStateAction<T>>,
  eventName: string
) => {
  const eventNames = useMemo(
    () => PgCommon.getStaticStateEventNames(eventName),
    [eventName]
  );
  useGetStatic(get, eventNames.get);
  useSetStatic(set, eventNames.set);
};
