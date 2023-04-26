import { useEffect } from "react";
import { useAtom } from "jotai";

import { EventName } from "../../../../../constants";
import { TerminalAction, terminalStateAtom } from "../../../../../state";
import { useBuild, useConnectOrSetupPg, useDeploy } from "./commands";
import { useSendAndReceiveCustomEvent } from "../../../../../hooks";

// Runs build and deploy commands if those components are not mounted
export const useTerminal = () => {
  const [, setTerminalState] = useAtom(terminalStateAtom);

  const { runBuild } = useBuild();
  const { runDeploy } = useDeploy();
  const { handleConnectPg } = useConnectOrSetupPg();

  // Listen for terminal state change
  useEffect(() => {
    const handleState = (
      e: UIEvent & { detail: { action: TerminalAction | TerminalAction[] } }
    ) => {
      setTerminalState(e.detail.action);
    };

    document.addEventListener(
      EventName.TERMINAL_STATE,
      handleState as EventListener
    );
    return () =>
      document.removeEventListener(
        EventName.TERMINAL_STATE,
        handleState as EventListener
      );
  }, [setTerminalState]);

  // Run build
  useSendAndReceiveCustomEvent(EventName.COMMAND_BUILD, runBuild);

  // Run deploy
  useSendAndReceiveCustomEvent(EventName.COMMAND_DEPLOY, runDeploy);

  // Run connect
  useSendAndReceiveCustomEvent(EventName.COMMAND_CONNECT, handleConnectPg);
};
