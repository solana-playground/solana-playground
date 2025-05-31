import { useCallback } from "react";

import { PgView } from "../../../utils/pg";

/** Darken/lighten the wallet component.  */
export const useDarken = () => {
  const darken = useCallback(() => {
    document
      .getElementById(PgView.ids.WALLET_MAIN)
      ?.classList.add(PgView.classNames.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document
      .getElementById(PgView.ids.WALLET_MAIN)
      ?.classList.remove(PgView.classNames.DARKEN);
  }, []);

  return { darken, lighten };
};
