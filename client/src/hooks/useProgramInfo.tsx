import { useEffect, useState } from "react";

import { PgCommon, PgProgramInfo } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";
import { useWallet } from "./useWallet";

export const useProgramInfo = () => {
  useRenderOnChange(PgProgramInfo.onDidChange);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { wallet } = useWallet();

  useEffect(() => {
    const { dispose } = PgProgramInfo.onDidChangeOnChain(async (onChain) => {
      setLoading(true);

      // Add delay for smooth transition
      await PgCommon.sleep(250);

      setError(!onChain);
      setLoading(false);
    });

    return () => dispose();
  }, []);

  return {
    loading,
    error,
    deployed: PgProgramInfo.onChain?.deployed,
    upgradable: PgProgramInfo.onChain?.upgradable,
    hasAuthority: wallet
      ? PgProgramInfo.onChain?.authority?.equals(wallet.publicKey)
      : false,
    hasProgramKp: !!PgProgramInfo.kp,
    hasUuid: !!PgProgramInfo.uuid,
    importedProgram: PgProgramInfo.importedProgram,
  };
};
