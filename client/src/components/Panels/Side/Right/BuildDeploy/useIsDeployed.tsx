import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import { programIdCountAtom } from "../../../../../state";

const useIsDeployed = () => {
  // To re-render if user changes program id
  const [programIdCount] = useAtom(programIdCountAtom);

  const { connection: conn } = useConnection();

  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [connError, setConnError] = useState(false);

  useEffect(() => {
    const getIsDeployed = async () => {
      console.log("running");
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
  }, [conn, programIdCount, setDeployed, setConnError]);

  return { deployed, setDeployed, connError };
};

export default useIsDeployed;
