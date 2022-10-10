import { Dispatch, SetStateAction, useEffect } from "react";

export const useSetStatic = (
  set: Dispatch<SetStateAction<any>>,
  eventName: string
) => {
  useEffect(() => {
    const handle = (e: UIEvent & { detail: any }) => {
      set(e.detail);
    };

    document.addEventListener(eventName, handle as EventListener);
    return () =>
      document.removeEventListener(eventName, handle as EventListener);
  }, [eventName, set]);
};
