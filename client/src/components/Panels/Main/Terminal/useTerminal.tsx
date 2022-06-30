import { useEffect } from "react";
import { useAtom } from "jotai";

import {
  TerminalAction,
  terminalOutputAtom,
  terminalStateAtom,
} from "../../../../state";
import { useBuild, useDeploy } from "../../Side/Right/BuildDeploy";
import { useSetupPg } from "../../Wallet";
import { PgTerminal } from "../../../../utils/pg";

// Runs build and deploy commands if those components are not mounted
const useTerminal = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();
  const { handleConnectPg } = useSetupPg();

  // Run build when build component is not mounted
  useEffect(() => {
    if (!terminalState.buildMounted && terminalState.buildStart) {
      setTerminalState(TerminalAction.buildStop);
      runBuild();
    }
  }, [terminalState, setTerminalState, runBuild]);

  // Run deploy when deploy component is not mounted
  useEffect(() => {
    if (!terminalState.deployMounted && terminalState.deployStart) {
      // This doesn't stop the current deploy but stops new deploys
      setTerminalState(TerminalAction.deployStop);
      runDeploy();
    }
  }, [terminalState, setTerminalState, runDeploy]);

  // Show setup wallet modal
  useEffect(() => {
    if (terminalState.walletSetupShow) {
      setTerminalState(TerminalAction.walletSetupHide);
      setTerminal(
        `Please connect ${PgTerminal.bold(
          "Playground Wallet"
        )} first in order to deploy.`
      );
      handleConnectPg();
    }
  }, [terminalState, setTerminalState, setTerminal, handleConnectPg]);

  return { setTerminalState };
};

export default useTerminal;
