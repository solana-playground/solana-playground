import { useCallback } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import {
  DEFAULT_PROGRAM,
  pgWalletAtom,
  Program,
  refreshPgWalletAtom,
  TerminalAction,
  terminalOutputAtom,
  terminalProgressAtom,
  terminalStateAtom,
  txHashAtom,
} from "../../../../../state";
import { PgCommon, PgDeploy, PgTerminal } from "../../../../../utils/pg";

export const useDeploy = (program: Program = DEFAULT_PROGRAM) => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setProgress] = useAtom(terminalProgressAtom);
  const [, setTxHash] = useAtom(txHashAtom);

  const { connection: conn } = useConnection();

  const runDeploy = useCallback(async () => {
    // This doesn't stop the current deploy but stops new deploys
    setTerminalState(TerminalAction.deployStop);

    PgTerminal.disable();

    if (!pgWallet.connected) {
      setTerminal(
        `${PgTerminal.bold(
          "Playground Wallet"
        )} must be connected in order to deploy.`
      );
      PgTerminal.enable();
      return;
    }

    setTerminalState(TerminalAction.deployLoadingStart);

    let msg = `${PgTerminal.info(
      "Deploying..."
    )} This could take a while depending on the program size and network conditions.`;
    setTerminal(msg);
    setProgress(0.1);

    try {
      const startTime = performance.now();
      const txHash = await PgDeploy.deploy(
        conn,
        pgWallet,
        setProgress,
        program.buffer
      );
      const timePassed = (performance.now() - startTime) / 1000;
      setTxHash(txHash);

      msg = `${PgTerminal.success(
        "Deployment successful."
      )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `${PgTerminal.error("Deployment error:")} ${convertedError}`;
      return 1; // To indicate error
    } finally {
      setTerminal(msg + "\n");
      setTerminalState(TerminalAction.deployLoadingStop);
      setProgress(0);
      PgTerminal.enable();
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conn,
    pgWallet,
    pgWalletChanged,
    program,
    setTerminal,
    setTxHash,
    setTerminalState,
  ]);

  return { runDeploy, pgWallet };
};
