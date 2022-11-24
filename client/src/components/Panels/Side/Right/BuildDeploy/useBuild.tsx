import { useCallback } from "react";
import { useAtom } from "jotai";

import {
  buildCountAtom,
  TerminalAction,
  terminalStateAtom,
} from "../../../../../state";
import { PgBuild, PgExplorer, PgTerminal } from "../../../../../utils/pg";

export const useBuild = () => {
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(() => {
    PgTerminal.runCmd(async () => {
      setTerminalState([
        TerminalAction.buildStop,
        TerminalAction.buildLoadingStart,
      ]);
      PgTerminal.log(PgTerminal.info("Building..."));

      const explorer = await PgExplorer.get();

      let msg = "";
      try {
        const files = explorer.getBuildFiles();
        const pythonFiles = files.filter(([fileName]) =>
          fileName.toLowerCase().endsWith(".py")
        );

        let result: { stderr: string };

        if (pythonFiles.length > 0) {
          result = await PgBuild.buildPython(pythonFiles);
        } else {
          result = await PgBuild.buildRust(files);
        }

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
        await explorer.saveProgramInfo();
      }
    });
  }, [setBuildCount, setTerminalState]);

  return { runBuild };
};
