import { useMemo } from "react";

import { PgCommon } from "../utils/pg";
import { useExposeGetClassAsStatic } from "./useExposeGetClassAsStatic";
import { useExposeMethodsAsStatic } from "./useExposeMethodsAsStatic";

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
