import { useEffect, useState } from "react";

import {
  PgCommand,
  PgCommon,
  PgConnection,
  PgProgramInfo,
} from "../../../../../utils/pg";
import { useAsyncEffect, usePgConnection } from "../../../../../hooks";

// TODO: Remove
export const useInitialLoading = () => {
  const { deployed, connError } = useIsDeployed();

  const [initialLoading, setInitialLoading] = useState(true);

  useAsyncEffect(async () => {
    const isBuilt = PgProgramInfo.uuid;
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
      if (!PgProgramInfo.pk) return;

      try {
        const conn = await PgConnection.get();
        const programExists = await conn.getAccountInfo(
          PgProgramInfo.pk,
          "processed"
        );

        setDeployed(!!programExists);
        setConnError(false);
      } catch {
        setDeployed(null);
        setConnError(true);
      }
    };

    const { dispose } = PgCommon.batchChanges(fetchIsDeployed, [
      PgProgramInfo.onDidChangePk,
      PgCommand.deploy.onDidRunFinish,
    ]);

    return () => dispose();
  }, []);

  return { deployed, connError };
};
