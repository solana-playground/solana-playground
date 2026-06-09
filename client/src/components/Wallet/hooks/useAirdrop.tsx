import { useEffect, useState } from "react";

import { PgCommand, PgConnection } from "../../../utils";

export const useAirdrop = () => {
  const [airdropCondition, setAirdropCondition] = useState(false);

  useEffect(() => {
    const { dispose } = PgConnection.onDidChangeCluster(() => {
      setAirdropCondition(!!PgConnection.getAirdropAmount());
    });
    return dispose;
  }, []);

  return { airdrop: PgCommand.airdrop.execute, airdropCondition };
};
