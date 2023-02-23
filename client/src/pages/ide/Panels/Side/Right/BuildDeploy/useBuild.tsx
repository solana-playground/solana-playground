import { useCallback } from "react";
import { useAtom } from "jotai";

import {
  buildCountAtom,
  TerminalAction,
  terminalStateAtom,
} from "../../../../../../state";
import { PgBuild, PgExplorer, PgTerminal } from "../../../../../../utils/pg";

export const useBuild = () => {
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(() => {
    PgTerminal.process(async () => {
      setTerminalState([
        TerminalAction.buildStop,
        TerminalAction.buildLoadingStart,
      ]);
      PgTerminal.log(PgTerminal.info("Building..."));

      let msg = "";
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
        setTerminalState(TerminalAction.buildLoadingStop);

        // Update program info in IndexedDB
        await PgExplorer.run({ saveProgramInfo: [] });
      }
    });
  }, [setBuildCount, setTerminalState]);

  return { runBuild };
};
