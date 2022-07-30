import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { PgCommon, PgProgramInfo } from "../../../../utils/pg";
import { deployCountAtom, refreshProgramIdAtom } from "../../../../state";

export const useInitialLoading = () => {
  const { deployed, setDeployed, connError } = useIsDeployed();

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const isBuilt = PgProgramInfo.getKp()?.programKp;
    const init = async () => {
      if (!isBuilt || deployed || deployed === false || connError) {
        setInitialLoading(true);
        // Add delay for smooth transition
        await PgCommon.sleep();
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
  // To re-render on new deploy
  const [deployCount] = useAtom(deployCountAtom);

  const { connection: conn } = useConnection();

  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [connError, setConnError] = useState(false);

  const getIsDeployed = useCallback(async () => {
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
  }, [conn]);

  useEffect(() => {
    getIsDeployed();
  }, [programIdCount, getIsDeployed]);

  useEffect(() => {
    // Only re-run if the program wasn't deployed at the start
    // No point of re-fetching this data if it's already deployed
    if (deployed === false) getIsDeployed();
  }, [deployed, deployCount, getIsDeployed]);

  return { deployed, setDeployed, connError };
};
