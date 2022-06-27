import { useCallback } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import {
  DEFAULT_PROGRAM,
  pgWalletAtom,
  Program,
  refreshPgWalletAtom,
  terminalOutputAtom,
  terminalProgressAtom,
  txHashAtom,
} from "../../../../../state";
import { PgCommon, PgDeploy, PgTerminal } from "../../../../../utils/pg";

export const useDeploy = (program: Program = DEFAULT_PROGRAM) => {
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setProgress] = useAtom(terminalProgressAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);

  const { connection: conn } = useConnection();

  const runDeploy = useCallback(async () => {
    if (!pgWallet.connected) return;

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
      return 1;
    } finally {
      setTerminal(msg + "\n");
      setProgress(0);
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn, pgWallet, pgWalletChanged, program, setTerminal, setTxHash]);

  return { runDeploy, pgWallet };
};
