import { useEffect, useState } from "react";

import { PgCommon } from "../../../utils/pg/common";
import { PgProgramInfo } from "../../../utils/pg/program-info";
import useIsDeployed from "./Right/BuildDeploy/useIsDeployed";

const useInitialLoading = () => {
  const { deployed, connError } = useIsDeployed();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const isBuilt = PgProgramInfo.getKp()?.programKp;
    const init = async () => {
      if (!isBuilt || deployed || deployed === false || connError) {
        setInitialLoading(true);
        // Add delay for smooth transition
        await PgCommon.sleep(250);
        setInitialLoading(false);
      }
    };

    init();
  }, [deployed, connError, setInitialLoading]);

  return { initialLoading };
};

export default useInitialLoading;
