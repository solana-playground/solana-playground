import { useEffect, useState } from "react";
import { useAtom } from "jotai";

import { terminalOutputAtom } from "../../../../state";
import { PgTerminal } from "../../../../utils/pg";
import { GITHUB_URL } from "../../../../constants";

export interface Wasm {
  parseSolana: (
    arg: string,
    endpoint: string,
    commitment: string,
    keypairBytes: Uint8Array
  ) => void;
}

const useWasm = () => {
  const [, setTerminalText] = useAtom(terminalOutputAtom);

  const [wasm, setWasm] = useState<Wasm>();

  // TODO: Load solana-cli only the first time user types a solana command
  // instead of loading by default
  useEffect(() => {
    if (!wasm)
      (async () => {
        let resultMsg = "";
        try {
          setTerminalText(PgTerminal.info("Loading Solana CLI..."));
          const { parseSolana } = await import("solana-cli-wasm");
          setWasm({ parseSolana });
          resultMsg = `${PgTerminal.success("Success.")}`;
        } catch (e: any) {
          console.log("Couldn't import solana-cli-wasm", e.message);
          resultMsg = `Error loading solana-cli. Please consider filing a bug report in ${GITHUB_URL}/issues
Error reason: ${e.message}`;
        } finally {
          setTerminalText(resultMsg + "\n");
          PgTerminal.enable();
        }
      })();
  }, [wasm, setWasm, setTerminalText]);

  // Listen for log events
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

export default useWasm;
