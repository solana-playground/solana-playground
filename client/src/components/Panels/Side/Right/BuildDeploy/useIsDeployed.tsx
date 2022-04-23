import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgProgramInfo } from "../../../../../utils/pg/program-info";

const useIsDeployed = () => {
  const { connection: conn } = useConnection();

  const [deployed, setDeployed] = useState(false);

  useEffect(() => {
    const getIsDeployed = async () => {
      const pkResult = PgProgramInfo.getProgramPk();
      if (pkResult.err) return;

      try {
        const programExists = await conn.getAccountInfo(pkResult.programPk!);

        if (programExists) setDeployed(true);
        else setDeployed(false);
      } catch {
        setDeployed(false);
      }
    };

    getIsDeployed();
  }, [conn, setDeployed]);

  return { deployed, setDeployed };
};

export default useIsDeployed;
