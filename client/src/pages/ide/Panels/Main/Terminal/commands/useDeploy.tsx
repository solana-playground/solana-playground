import { useCallback } from "react";

import {
  DEFAULT_PROGRAM,
  Program,
  TerminalAction,
} from "../../../../../../state";
import {
  PgCommon,
  PgDeploy,
  PgProgramInfo,
  PgTerminal,
  PgTx,
  PgWallet,
} from "../../../../../../utils/pg";

// TODO: Remove
export const useDeploy = (program: Program = DEFAULT_PROGRAM) => {
  const runDeploy = useCallback(async () => {
    const upgradable = PgProgramInfo.onChain?.upgradable;
    const authority = PgProgramInfo.onChain?.authority;
    const hasAuthority = authority?.equals(PgWallet.publicKey);

    if (upgradable === false) {
      PgTerminal.log(PgTerminal.warning("The program is not upgradable."));
      return;
    }
    if (hasAuthority === false) {
      PgTerminal.log(
        `${PgTerminal.warning(
          "You don't have the authority to upgrade this program."
        )}
Program ID: ${PgProgramInfo.pk}
Program authority: ${authority}
Your address: ${PgWallet.publicKey}`
      );
      return;
    }

    PgTerminal.setTerminalState(TerminalAction.deployLoadingStart);
    PgTerminal.log(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    PgTerminal.setProgress(0.1);

    let msg;
    try {
      const startTime = performance.now();
      const txHash = await PgDeploy.deploy(program.buffer);
      const timePassed = (performance.now() - startTime) / 1000;
      PgTx.notify(txHash);

      msg = `${PgTerminal.success(
        "Deployment successful."
      )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
      return 1; // To indicate error
    } finally {
      PgTerminal.log(msg + "\n");
      PgTerminal.setTerminalState(TerminalAction.deployLoadingStop);
      PgTerminal.setProgress(0);
    }
  }, [program]);

  return { runDeploy };
};
