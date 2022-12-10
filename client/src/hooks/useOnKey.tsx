import { useEffect } from "react";

export const useOnKey = (
  key: KeyboardEvent["key"],
  handle: (e: KeyboardEvent) => any
) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === key) {
        handle(e);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [key, handle]);
};
