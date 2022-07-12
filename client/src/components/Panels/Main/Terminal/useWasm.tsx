import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";

import { terminalOutputAtom } from "../../../../state";
import { PgTerminal, Wasm, WasmPkg } from "../../../../utils/pg";
import { GITHUB_URL } from "../../../../constants";

export const useWasm = () => {
  const [, setTerminalText] = useAtom(terminalOutputAtom);

  const [wasm, setWasm] = useState<Wasm>();

  const loadSolanaCli = useCallback(async () => {
    let resultMsg = "";
    try {
      setTerminalText(PgTerminal.info("Loading Solana CLI..."));
      const { parseSolana } = await import("solana-cli-wasm");
      setWasm({ parseSolana });
      resultMsg = `${PgTerminal.success("Success.")}`;
      PgTerminal.runLastCmd();
    } catch (e: any) {
      resultMsg = `Error loading solana-cli. Please consider filing a bug report in ${PgTerminal.underline(
        GITHUB_URL + "/issues"
      )}
Error reason: ${e.message}`;
    } finally {
      setTerminalText(resultMsg + "\n");
    }
  }, [setWasm, setTerminalText]);

  // Load solana cli only when user first enters a solana command
  useEffect(() => {
    const handleLoadWasm = (e: UIEvent) => {
      // @ts-ignore
      const pkg = e.detail.pkg as WasmPkg;
      switch (pkg) {
        case WasmPkg.SOLANA_CLI:
          if (!wasm?.parseSolana) loadSolanaCli();
      }
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_LOAD_WASM,
      handleLoadWasm as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_LOAD_WASM,
        handleLoadWasm as EventListener
      );
  }, [wasm, loadSolanaCli]);

  // Listen for custom terminal events
  useEffect(() => {
    const handleLog = (e: UIEvent) => {
      // @ts-ignore
      setTerminalText(e.detail.msg);
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_TERMINAL_LOG,
      handleLog as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_TERMINAL_LOG,
        handleLog as EventListener
      );
  }, [setTerminalText]);

  return wasm;
};
