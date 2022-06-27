import { useAtom } from "jotai";
import { useCallback } from "react";

import {
  buildCountAtom,
  explorerAtom,
  terminalOutputAtom,
} from "../../../../../state";
import { PgBuild, PgTerminal } from "../../../../../utils/pg";

export const useBuild = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);

  const runBuild = useCallback(async () => {
    if (!explorer) return;

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
    }
  }, [explorer, setTerminal, setBuildCount]);

  return { runBuild };
};
