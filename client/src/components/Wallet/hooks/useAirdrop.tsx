import { useEffect, useState } from "react";

import { PgCommand, PgConnection } from "../../../utils";

export const useAirdrop = () => {
  const [airdropAmount, setAirdropAmount] =
    useState<ReturnType<typeof PgConnection["getAirdropAmount"]>>(null);

  useEffect(() => {
    const { dispose } = PgConnection.onDidChangeCurrent(() => {
      setAirdropAmount(PgConnection.getAirdropAmount());
    });
    return dispose;
  }, []);

  const airdrop = PgCommand.airdrop.execute;

  return { airdrop, airdropCondition: !!airdropAmount };
};
