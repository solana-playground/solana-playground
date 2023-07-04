import { useEffect } from "react";

import { PgKeybind, WithOptionalDependencyList } from "../utils/pg";

/** Parameters of `PgKeybind.add` */
type AddKeybindParams = Parameters<typeof PgKeybind["add"]>;

/** Add keybind(s). */
export const useKeybind = (
  ...args: WithOptionalDependencyList<AddKeybindParams>
) => {
  useEffect(() => {
    const { dispose } = PgKeybind.add(...(args as AddKeybindParams));
    return () => dispose();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, getDeps(args));
};

/** Get `React.DependencyList`. */
const getDeps = (args: Parameters<typeof useKeybind>) => {
  switch (args.length) {
    case 1:
      return [args[0]];

    case 2: {
      // Refresh each time the handler function changes
      if (typeof args[0] === "string") return [args[1]];

      // Multiple keybinds with dependency list
      return args[1] as React.DependencyList;
    }

    case 3:
      return args[2];
  }
};
