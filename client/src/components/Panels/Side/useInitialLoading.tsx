import { useEffect, useState } from "react";
import useIsDeployed from "./Right/BuildDeploy/useIsDeployed";

const useInitialLoading = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const { deployed, connError } = useIsDeployed();

  useEffect(() => {
    if (deployed || deployed === false) setInitialLoading(false);
    // Connection error
    else if (connError) setInitialLoading(false);
  }, [deployed, connError, setInitialLoading]);

  return { initialLoading };
};

export default useInitialLoading;
