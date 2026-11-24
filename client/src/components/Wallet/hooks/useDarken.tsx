import { useCallback } from "react";

import { PgView } from "../../../utils";

/** Element ID of the main wallet component */
export const WALLET_MAIN_ID = "wallet-main";

/** Darken/lighten the wallet component.  */
export const useDarken = () => {
  const darken = useCallback(() => {
    document
      .getElementById(WALLET_MAIN_ID)
      ?.classList.add(PgView.classNames.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document
      .getElementById(WALLET_MAIN_ID)
      ?.classList.remove(PgView.classNames.DARKEN);
  }, []);

  return { darken, lighten };
};
