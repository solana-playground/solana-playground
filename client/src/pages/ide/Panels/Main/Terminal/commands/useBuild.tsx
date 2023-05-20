import { useCallback } from "react";

import { EventName } from "../../../../../../constants";
import { TerminalAction } from "../../../../../../state";
import { PgBuild, PgCommon, PgTerminal } from "../../../../../../utils/pg";

export const useBuild = () => {
  const runBuild = useCallback(async () => {
    PgTerminal.setTerminalState(TerminalAction.buildLoadingStart);
    PgTerminal.log(PgTerminal.info("Building..."));

    let msg;
    try {
      const result = await PgBuild.build();
      msg = PgTerminal.editStderr(result.stderr);
      PgCommon.createAndDispatchCustomEvent(EventName.BUILD_ON_DID_BUILD);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Build error: ${convertedError}`;
    } finally {
      PgTerminal.log(msg + "\n");
      PgTerminal.setTerminalState(TerminalAction.buildLoadingStop);
    }
  }, []);

  return { runBuild };
};
