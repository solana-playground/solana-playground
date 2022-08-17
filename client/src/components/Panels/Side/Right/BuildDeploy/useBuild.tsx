import { useCallback, useState } from "react";
import { useAtom } from "jotai";

import {
  buildCountAtom,
  explorerAtom,
  TerminalAction,
  terminalOutputAtom,
  terminalStateAtom,
} from "../../../../../state";
import {
  PgBuild,
  PgPkg,
  PgTerminal,
  PkgName,
  Pkgs,
} from "../../../../../utils/pg";

export const useBuild = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setBuildCount] = useAtom(buildCountAtom);
  const [seahorsePkg, setSeahorsePkg] = useState<Pkgs | undefined>(undefined);

  const getSeahorsePkg = useCallback(async () => {
    if (seahorsePkg) {
      return seahorsePkg;
    }
    const pkg = await PgPkg.loadPkg(PkgName.SEAHORSE_COMPILE);
    setSeahorsePkg(pkg);
    return pkg;
  }, [seahorsePkg]);

  const runBuild = useCallback(() => {
    PgTerminal.run(async () => {
      setTerminalState(TerminalAction.buildStop);

      if (!explorer) return;

      setTerminalState(TerminalAction.buildLoadingStart);
      setTerminal(PgTerminal.info("Building..."));

      let msg = "";
      try {
        const files = explorer.getBuildFiles();
        const pythonFiles = files.filter(([fileName]) =>
          fileName.toLowerCase().endsWith(".py")
        );

        let result: { stderr: string };

        if (pythonFiles.length > 0) {
          const seahorsePkgToBuild = await getSeahorsePkg();
          result = await PgBuild.buildPython(pythonFiles, seahorsePkgToBuild);
        } else {
          result = await PgBuild.buildRust(files);
        }

        msg = PgTerminal.editStderr(result.stderr);

        // To update programId each build
        setBuildCount((c) => c + 1);
      } catch (e: any) {
        msg = `${PgTerminal.error("Build error:")} ${e.message}\n`;
      } finally {
        setTerminal(msg);
        setTerminalState(TerminalAction.buildLoadingStop);
      }
    });
  }, [explorer, setTerminal, setBuildCount, setTerminalState, getSeahorsePkg]);

  return { runBuild };
};
