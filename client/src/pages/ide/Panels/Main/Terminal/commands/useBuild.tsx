import { useCallback } from "react";
import { useAtom } from "jotai";

import { buildCountAtom, TerminalAction } from "../../../../../../state";
import { PgBuild, PgTerminal } from "../../../../../../utils/pg";

export const useBuild = () => {
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(async () => {
    PgTerminal.setTerminalState(TerminalAction.buildLoadingStart);
    PgTerminal.log(PgTerminal.info("Building..."));

    let msg;
    try {
      const result = await PgBuild.build();
      msg = PgTerminal.editStderr(result.stderr);

      // To update programId each build
      setBuildCount((c) => c + 1);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Build error: ${convertedError}`;
    } finally {
      PgTerminal.log(msg + "\n");
      PgTerminal.setTerminalState(TerminalAction.buildLoadingStop);
    }
  }, [setBuildCount]);

  return { runBuild };
};
