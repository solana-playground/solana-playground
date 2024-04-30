import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Id } from "../../../../../constants";

export const useResize = (setWidth: Dispatch<SetStateAction<number>>) => {
  const [windowHeight, setWindowHeight] = useState(getWindowHeight);

  // Resize the sidebar on window resize event
  useEffect(() => {
    const handleResize = () => setWindowHeight(getWindowHeight);
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResizeStop = useCallback(
    (e, direction, ref, d) => {
      setWidth((w) => {
        const newWidth = w + d.width;
        if (newWidth < 180) return 0;

        return newWidth;
      });
    },
    [setWidth]
  );

  return { windowHeight, handleResizeStop };
};

const getWindowHeight = () => {
  return document.getElementById(Id.ROOT)?.getClientRects()[0]?.height ?? 979;
};
