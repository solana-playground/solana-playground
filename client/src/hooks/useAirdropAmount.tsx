import { useMemo } from "react";

import { PgCommon } from "../utils/pg";
import { usePgConnection } from "./usePgConnection";

export const useAirdropAmount = () => {
  const { connection } = usePgConnection();

  const amount = useMemo(() => {
    return PgCommon.getAirdropAmount(connection.rpcEndpoint);
  }, [connection.rpcEndpoint]);

  return amount;
};
