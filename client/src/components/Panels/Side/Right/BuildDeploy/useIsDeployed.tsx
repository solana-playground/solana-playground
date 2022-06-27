import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgProgramInfo } from "../../../../../utils/pg";
import { refreshProgramIdAtom } from "../../../../../state";

export const useIsDeployed = () => {
  // To re-render if user changes program id
  const [programIdCount] = useAtom(refreshProgramIdAtom);

  const { connection: conn } = useConnection();

  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [connError, setConnError] = useState(false);

  useEffect(() => {
    const getIsDeployed = async () => {
      const programPk = PgProgramInfo.getPk()?.programPk;
      if (!programPk) return;

      try {
        const programExists = await conn.getAccountInfo(programPk);

        if (programExists) setDeployed(true);
        else setDeployed(false);

        setConnError(false);
      } catch {
        setDeployed(null);
        setConnError(true);
      }
    };

    getIsDeployed();
  }, [conn, programIdCount, setDeployed, setConnError]);

  return { deployed, setDeployed, connError };
};
