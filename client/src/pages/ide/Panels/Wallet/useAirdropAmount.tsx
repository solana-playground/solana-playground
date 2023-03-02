import { useMemo } from "react";
import { useAtom } from "jotai";

import { connectionConfigAtom } from "../../../../state";
import { PgCommon } from "../../../../utils/pg";

export const useAirdropAmount = () => {
  const [conn] = useAtom(connectionConfigAtom);

  const amount = useMemo(() => {
    return PgCommon.getAirdropAmount(conn.endpoint);
  }, [conn.endpoint]);

  return amount;
};
