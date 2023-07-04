import { useEffect } from "react";

import { Arrayable, PgKeybind } from "../utils/pg";

export const useKeybind = (
  keybinds: Arrayable<{ keybind: string; handle: () => unknown }>,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const { dispose } = PgKeybind.add(keybinds);
    return () => dispose();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
