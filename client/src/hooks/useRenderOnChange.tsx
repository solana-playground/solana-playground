import { useEffect, useReducer, useState } from "react";

import type { Disposable } from "../utils";

export const useRenderOnChange = <T, G extends () => T>(
  onChange: ((cb: (v?: T) => any) => Disposable) & { getValue?: G }
) => {
  const [value, setValue] = useState(() => onChange?.getValue?.());
  const [, render] = useReducer((r) => r + 1, 0);
  const [effect, runEffect] = useReducer((r) => r + 1, 0);

  useEffect(() => {
    // If `onChange` doesn't exist, re-run the effect after a timeout
    if (!onChange) {
      setTimeout(() => runEffect(), 10);
      return;
    }

    const { dispose } = onChange((newValue) => {
      if (newValue === undefined) {
        render();
        return;
      }

      const valueType = typeof newValue;

      // Static class is type `function`. Intentionally passing a function because
      // `useState` does not accept static classes as a value.
      if (valueType === "function") {
        setValue(() => newValue);
        render();
      } else if (valueType === "object") {
        setValue(newValue);
        render();
      } else {
        setValue(newValue);
      }
    });
    return dispose;
  }, [effect, onChange]);

  return (
    value === undefined ? onChange?.getValue?.() : value
  ) as G extends undefined ? T | undefined : T;
};
