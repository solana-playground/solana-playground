import { useCallback } from "react";

import { ClassName, Id } from "../../../constants";

/** Darken/lighten the wallet component.  */
export const useDarken = () => {
  const darken = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.add(ClassName.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  return { darken, lighten };
};
