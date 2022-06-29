import { useEffect } from "react";
import { useAtom } from "jotai";

import { terminalStateAtom } from "../../../../state";
import { useBuild, useDeploy } from "../../Side/Right/BuildDeploy";

// Runs build and deploy commands if those components are not mounted
const useTerminal = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();

  // Run build when build component is not mounted
  useEffect(() => {
    if (!terminalState.buildMounted && terminalState.buildStart) {
      runBuild();
    }
  }, [terminalState, runBuild]);

  // Run deploy when deploy component is not mounted
  useEffect(() => {
    if (!terminalState.deployMounted && terminalState.deployStart) {
      runDeploy();
    }
  }, [terminalState, runDeploy]);

  return { setTerminalState };
};

export default useTerminal;
