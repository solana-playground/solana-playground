import { useEffect, useState } from "react";

import { PgCommon, PgProgramInfo } from "../../../utils/pg";
import { useIsDeployed } from "./Right/BuildDeploy";

const useInitialLoading = () => {
  const { deployed, connError } = useIsDeployed();
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

  return { initialLoading };
};

export default useInitialLoading;
