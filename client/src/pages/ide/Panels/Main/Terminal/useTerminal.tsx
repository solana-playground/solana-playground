import { useEffect } from "react";
import { useAtom } from "jotai";

import { EventName } from "../../../../../constants";
import { TerminalAction, terminalStateAtom } from "../../../../../state";

/** Handle terminal state */
export const useTerminal = () => {
  const [, setTerminalState] = useAtom(terminalStateAtom);

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
};
