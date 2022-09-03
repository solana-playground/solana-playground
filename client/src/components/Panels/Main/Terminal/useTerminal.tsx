import { useEffect } from "react";
import { useAtom } from "jotai";

import {
  TerminalAction,
  terminalOutputAtom,
  terminalStateAtom,
} from "../../../../state";
import { useBuild, useDeploy } from "../../Side/Right/BuildDeploy";
import { useConnectOrSetupPg } from "../../Wallet";
import { PgTerminal } from "../../../../utils/pg";

// Runs build and deploy commands if those components are not mounted
export const useTerminal = () => {
  const [terminalState, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminalText] = useAtom(terminalOutputAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();
  const { handleConnectPg } = useConnectOrSetupPg();

  // Listen for log event
  useEffect(() => {
    const handleLog = (e: UIEvent) => {
      // @ts-ignore
      const msg = e.detail.msg;
      if (typeof msg === "string") setTerminalText(msg);
      else if (typeof msg === "object") setTerminalText(JSON.stringify(msg));
      else setTerminalText(`${msg}`); // all data types should be converted to string
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_TERMINAL_LOG,
      handleLog as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_TERMINAL_LOG,
        handleLog as EventListener
      );
  }, [setTerminalText]);

  // Listen for terminal state change
  useEffect(() => {
    const handleState = (e: UIEvent) => {
      // @ts-ignore
      setTerminalState(e.detail.action);
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_TERMINAL_STATE,
      handleState as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_TERMINAL_STATE,
        handleState as EventListener
      );
  }, [setTerminalState]);

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
};
