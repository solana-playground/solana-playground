import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgCommon, PgProgramInfo } from "../../../../utils/pg";
import { refreshProgramIdAtom } from "../../../../state";

export const useInitialLoading = () => {
  const { deployed, setDeployed, connError } = useIsDeployed();

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const isBuilt = PgProgramInfo.getKp()?.programKp;
    const init = async () => {
      if (!isBuilt || deployed || deployed === false || connError) {
        setInitialLoading(true);
        // Add delay for smooth transition
        await PgCommon.sleep(PgCommon.TRANSITION_SLEEP);
        setInitialLoading(false);
      }
    };

    init();
  }, [deployed, connError, setInitialLoading]);

  return { initialLoading, deployed, setDeployed, connError };
};

const useIsDeployed = () => {
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
