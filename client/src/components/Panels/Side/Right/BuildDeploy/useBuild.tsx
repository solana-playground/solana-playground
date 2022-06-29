import { useCallback } from "react";
import { useAtom } from "jotai";

import {
  buildCountAtom,
  explorerAtom,
  TerminalAction,
  terminalOutputAtom,
  terminalStateAtom,
} from "../../../../../state";
import { PgBuild, PgTerminal } from "../../../../../utils/pg";

export const useBuild = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(async () => {
    if (!explorer) return;

    // This doesn't stop the current deploy but stops new deploys
    setTerminalState([
      TerminalAction.buildStop,
      TerminalAction.buildLoadingStart,
    ]);

    let msg = PgTerminal.info("Building...");
    setTerminal(msg);

    try {
      const result = await PgBuild.build(explorer.getBuildFiles());

      msg = PgTerminal.editStderr(result.stderr, result.uuid);

      // To update programId each build
      setBuildCount((c) => c + 1);
    } catch (e: any) {
      msg = `${PgTerminal.error("Build error:")} ${e.message}\n`;
    } finally {
      setTerminal(msg);
      setTerminalState(TerminalAction.buildLoadingStop);
    }
  }, [explorer, setTerminal, setBuildCount, setTerminalState]);

  return { runBuild };
};
