import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgProgramInfo } from "../../../../../utils/pg/program-info";

const useIsDeployed = () => {
  const { connection: conn } = useConnection();

  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [connError, setConnError] = useState(false);

  useEffect(() => {
    const getIsDeployed = async () => {
      const pkResult = PgProgramInfo.getPk();
      if (pkResult.err) return;

      try {
        const programExists = await conn.getAccountInfo(pkResult.programPk!);

        if (programExists) setDeployed(true);
        else setDeployed(false);

        setConnError(false);
      } catch {
        setDeployed(null);
        setConnError(true);
      }
    };

    getIsDeployed();
  }, [conn, setDeployed, setConnError]);

  return { deployed, setDeployed, connError };
};

export default useIsDeployed;
