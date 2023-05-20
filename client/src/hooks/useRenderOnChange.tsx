import { useEffect, useReducer, useState } from "react";

import type { PgDisposable } from "../utils/pg";

export const useRenderOnChange = <T,>(
  onChange: (cb: (v?: T) => any) => PgDisposable
) => {
  const [value, setValue] = useState<T>();
  const [, render] = useReducer((r) => r + 1, 0);

  useEffect(() => {
    const { dispose } = onChange((newValue) => {
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
    return () => dispose();
  }, [onChange]);

  return value;
};
