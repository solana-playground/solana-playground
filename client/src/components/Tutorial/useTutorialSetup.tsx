import { useEffect } from "react";

export const useTutorialSetup = (cb: () => Promise<void>) => {
  useEffect(() => {
    cb();
  }, [cb]);
};
