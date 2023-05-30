import { useEffect, useState } from "react";
import { useRenderOnChange } from "../../../../../hooks";

import { PgCommon, PgProgramInfo, PgWallet } from "../../../../../utils/pg";

export const useProgramInfo = () => {
  useRenderOnChange(PgProgramInfo.onDidChange);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    hasAuthority: PgProgramInfo.onChain?.authority?.equals(PgWallet.publicKey),
    hasProgramKp: !!PgProgramInfo.kp,
    hasUuid: !!PgProgramInfo.uuid,
    hasProgramPk: !!PgProgramInfo.pk,
    uploadedProgram: PgProgramInfo.uploadedProgram,
  };
};
