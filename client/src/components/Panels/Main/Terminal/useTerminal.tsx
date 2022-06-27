import { useEffect } from "react";

import useCmd from "./useCmd";
import { TerminalAction } from "../../../../state";

const useTerminal = () => {
  const { runBuild, terminalState, setTerminalState } = useCmd();

  // Run build if build is not mounted
  useEffect(() => {
    if (!terminalState.buildMounted && terminalState.runBuild) {
      setTerminalState(TerminalAction.notRunBuild);
      runBuild();
    }
  }, [terminalState, runBuild, setTerminalState]);

  return { setTerminalState };
};

export default useTerminal;
