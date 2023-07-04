import { useEffect } from "react";

export const useOnKey = (
  key: KeyboardEvent["key"],
  handle: (ev: KeyboardEvent) => unknown
) => {
  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === key) handle(ev);
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [key, handle]);
};
