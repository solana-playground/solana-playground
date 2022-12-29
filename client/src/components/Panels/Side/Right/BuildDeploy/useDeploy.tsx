import { useCallback } from "react";
import { useAtom } from "jotai";

import {
  DEFAULT_PROGRAM,
  deployCountAtom,
  pgWalletAtom,
  Program,
  refreshPgWalletAtom,
  TerminalAction,
  terminalStateAtom,
  txHashAtom,
} from "../../../../../state";
import {
  PgCommon,
  PgDeploy,
  PgProgramInfo,
  PgTerminal,
  PgWallet,
} from "../../../../../utils/pg";
import { useAuthority } from "./useAuthority";

export const useDeploy = (program: Program = DEFAULT_PROGRAM) => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [, setDeployCount] = useAtom(deployCountAtom);

  const { authority, hasAuthority, upgradeable } = useAuthority();

  const runDeploy = useCallback(async () => {
    return await PgTerminal.runCmd(async () => {
      // This doesn't stop the current deploy but stops new deploys
      setTerminalState(TerminalAction.deployStop);

      if (!pgWallet.connected) {
        PgTerminal.log(
          `${PgTerminal.bold(
            "Playground Wallet"
          )} must be connected in order to deploy.`
        );
        return;
      }
      if (upgradeable === false) {
        PgTerminal.log(PgTerminal.warning("The program is not upgradeable."));
        return;
      }
      if (hasAuthority === false) {
        PgTerminal.log(
          `${PgTerminal.warning(
            "You don't have the authority to upgrade this program."
          )}
Program ID: ${PgProgramInfo.getPk()!.programPk}
Program authority: ${authority}
Your address: ${PgWallet.getKp().publicKey}`
        );
        return;
      }

      setTerminalState(TerminalAction.deployLoadingStart);
      PgTerminal.log(
        `${PgTerminal.info(
          "Deploying..."
        )} This could take a while depending on the program size and network conditions.`
      );
      PgTerminal.setProgress(0.1);

      let msg;
      try {
        const startTime = performance.now();
        const txHash = await PgDeploy.deploy(pgWallet, program.buffer);
        const timePassed = (performance.now() - startTime) / 1000;
        setTxHash(txHash);

        msg = `${PgTerminal.success(
          "Deployment successful."
        )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
        setDeployCount((c) => c + 1);
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        msg = `Deployment error: ${convertedError}`;
        return 1; // To indicate error
      } finally {
        PgTerminal.log(msg + "\n");
        setTerminalState(TerminalAction.deployLoadingStop);
        PgTerminal.setProgress(0);
      }
    });

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pgWallet,
    pgWalletChanged,
    program,
    authority,
    hasAuthority,
    upgradeable,
    setTxHash,
    setTerminalState,
    setDeployCount,
  ]);

  return { runDeploy, pgWallet, hasAuthority, upgradeable };
};
