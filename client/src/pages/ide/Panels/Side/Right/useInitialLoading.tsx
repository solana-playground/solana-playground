import { useEffect, useState } from "react";

import {
  PgCommon,
  PgConnection,
  PgDeploy,
  PgProgramInfo,
} from "../../../../../utils/pg";
import { useAsyncEffect, usePgConnection } from "../../../../../hooks";

export const useInitialLoading = () => {
  const { deployed, connError } = useIsDeployed();

  const [initialLoading, setInitialLoading] = useState(true);

  useAsyncEffect(async () => {
    const isBuilt = PgProgramInfo.state.uuid;
    if (!isBuilt || deployed || deployed === false || connError) {
      setInitialLoading(true);
      // Add delay for smooth transition
      await PgCommon.sleep(250);
      setInitialLoading(false);
    }
  }, [deployed, connError]);

  return { initialLoading, deployed, connError };
};

const useIsDeployed = () => {
  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [connError, setConnError] = useState(false);

  const { connection: conn } = usePgConnection();

  useEffect(() => {
    // Reset deployed state on connection change
    setDeployed(null);
  }, [conn]);

  useEffect(() => {
    const fetchIsDeployed = async () => {
      const programPk = PgProgramInfo.getPk();
      if (!programPk) return;

      try {
        const conn = await PgConnection.get();
        const programExists = await conn.getAccountInfo(programPk, "processed");

        setDeployed(!!programExists);
        setConnError(false);
      } catch {
        setDeployed(null);
        setConnError(true);
      }
    };

    const { dispose } = PgCommon.batchChanges(fetchIsDeployed, [
      PgProgramInfo.onDidChangePk,
      PgDeploy.onDidDeploy,
    ]);

    return () => dispose();
  }, []);

  return { deployed, connError };
};
