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
      const { runSolana } = await import("solana-cli-wasm");
      setWasm((w) => ({ ...w, runSolana }));
      resultMsg = `${PgTerminal.success("Success.")}`;

      // This prevents unnecessary looping
      setTimeout(() => PgTerminal.runLastCmd());
    } catch (e: any) {
      resultMsg = `Error loading Solana CLI. Please consider filing a bug report in ${PgTerminal.underline(
        GITHUB_URL + "/issues"
      )}
Error reason: ${e.message}`;
    } finally {
      setTerminalText(resultMsg + "\n");
    }
  }, [setTerminalText]);

  const loadSplTokenCli = useCallback(async () => {
    let resultMsg = "";
    try {
      setTerminalText(PgTerminal.info("Loading SPL-Token CLI..."));
      const { runSplToken } = await import("spl-token-cli-wasm");
      setWasm((w) => ({ ...w, runSplToken }));
      resultMsg = `${PgTerminal.success("Success.")}`;

      // This prevents unnecessary looping
      setTimeout(() => PgTerminal.runLastCmd());
    } catch (e: any) {
      resultMsg = `Error loading SPL-Token CLI. Please consider filing a bug report in ${PgTerminal.underline(
        GITHUB_URL + "/issues"
      )}
Error reason: ${e.message}`;
    } finally {
      setTerminalText(resultMsg + "\n");
    }
  }, [setTerminalText]);

  // Load solana cli only when user first enters a solana command
  useEffect(() => {
    const handleLoadWasm = (e: UIEvent) => {
      // @ts-ignore
      const pkg = e.detail.pkg as WasmPkg;
      if (pkg === WasmPkg.SOLANA_CLI) loadSolanaCli();
      else if (pkg === WasmPkg.SPL_TOKEN_CLI) loadSplTokenCli();
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
  }, [wasm, loadSolanaCli, loadSplTokenCli]);

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
