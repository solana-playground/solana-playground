import { useCallback } from "react";
import { useAtom } from "jotai";

import {
  buildCountAtom,
  explorerAtom,
  TerminalAction,
  terminalStateAtom,
} from "../../../../../state";
import { PgBuild, PgPkg, PgTerminal } from "../../../../../utils/pg";

export const useBuild = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(() => {
    PgTerminal.runCmd(async () => {
      setTerminalState(TerminalAction.buildStop);

      if (!explorer) return;

      setTerminalState(TerminalAction.buildLoadingStart);
      PgTerminal.log(PgTerminal.info("Building..."));

      let msg = "";
      try {
        const files = explorer.getBuildFiles();
        const pythonFiles = files.filter(([fileName]) =>
          fileName.toLowerCase().endsWith(".py")
        );

        let result: { stderr: string };

        if (pythonFiles.length > 0) {
          const seahorsePkgToBuild = await PgPkg.loadPkg(
            PgPkg.SEAHORSE_COMPILE
          );
          result = await PgBuild.buildPython(pythonFiles, seahorsePkgToBuild);
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
  }, [explorer, setBuildCount, setTerminalState]);

  return { runBuild };
};
