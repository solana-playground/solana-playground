import { useEffect } from "react";
import { useAtom } from "jotai";

import { TerminalAction, terminalStateAtom } from "../../../../state";
import { useBuild, useDeploy } from "../../Side/Right/BuildDeploy";
import { useConnectOrSetupPg } from "../../Wallet";

// Runs build and deploy commands if those components are not mounted
const useTerminal = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();
  const { handleConnectPg } = useConnectOrSetupPg();

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

  // Run after connect command
  useEffect(() => {
    if (terminalState.walletConnectOrSetup) {
      setTerminalState(TerminalAction.walletConnectOrSetupStop);
      handleConnectPg();
    }
  }, [terminalState, setTerminalState, handleConnectPg]);

  return { setTerminalState };
};

export default useTerminal;
