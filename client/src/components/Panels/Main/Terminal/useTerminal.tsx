import { useAtom } from "jotai";
import { useEffect } from "react";

import { TerminalAction, terminalStateAtom } from "../../../../state";
import { useBuild, useDeploy } from "../../Side/Right/BuildDeploy";

// Runs build and deploy commands if those components are not mounted
const useTerminal = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();

  useEffect(() => {
    if (!terminalState.buildMounted && terminalState.runBuild) {
      setTerminalState(TerminalAction.notRunBuild);
      runBuild();
    }
  }, [terminalState, runBuild, setTerminalState]);

  useEffect(() => {
    if (!terminalState.deployMounted && terminalState.runDeploy) {
      setTerminalState(TerminalAction.notRunDeploy);
      runDeploy();
    }
  }, [terminalState, runDeploy, setTerminalState]);

  return { setTerminalState };
};

export default useTerminal;
