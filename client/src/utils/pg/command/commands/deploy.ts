import { Keypair } from "@solana/web3.js";

import { createCmd } from "../create-command";
import { PgCommandValidation } from "../validation";
import { PgCommon } from "../../common";
import { PgConnection } from "../../connection";
import { PgProgramInfo } from "../../program-info";
import { PgServer } from "../../server";
import { PgTerminal } from "../../terminal";
import { PgTx } from "../../tx";
import { PgWallet } from "../../wallet";
import { TerminalAction } from "../../../../state";
import { GITHUB_URL } from "../../../../constants";
import { BpfLoaderUpgradeable } from "../../../bpf-upgradeable-browser";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  run: async () => {
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
      const txHash = await processDeploy();
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
  },
  preCheck: [PgCommandValidation.isPgConnected, checkDeploy],
});

/** Check whether the state is valid for deployment. */
async function checkDeploy() {
  if (!PgProgramInfo.onChain) {
    throw new Error(
      `Could not fetch on-chain data. Try using a different RPC provider with '${PgTerminal.bold(
        "solana config set -u <RPC_URL>"
      )}' command.`
    );
  }

  if (!PgProgramInfo.onChain.upgradable) {
    throw new Error(PgTerminal.warning("The program is not upgradable."));
  }

  const authority = PgProgramInfo.onChain.authority;
  const hasAuthority =
    !authority || authority.equals(PgWallet.current!.publicKey);

  if (!hasAuthority) {
    throw new Error(`You don't have the authority to upgrade this program.
Program ID: ${PgProgramInfo.pk}
Program authority: ${authority}
Your address: ${PgWallet.current!.publicKey}`);
  }
}

/** Maximum amount of transaction retries */
const MAX_RETRIES = 5;

/** Sleep amount multiplier each time a transaction fails */
const SLEEP_MULTIPLIER = 1.6;

/**
 * Deploy the current program.
 *
 * @returns the deployment transaction signature if the deployment succeeds
 */
const processDeploy = async () => {
  const programPk = PgProgramInfo.pk;
  if (!programPk) throw new Error("Program id not found.");

  // Regular deploy without custom elf upload
  let programBuffer = PgProgramInfo.uploadedProgram?.buffer;
  if (!programBuffer?.length) {
    if (!PgProgramInfo.uuid) throw new Error("Program is not built.");
    programBuffer = await PgServer.deploy(PgProgramInfo.uuid);
  }

  // Get connection
  const conn = PgConnection.current;

  // Create buffer
  const bufferKp = Keypair.generate();
  const bufferSize = BpfLoaderUpgradeable.getBufferAccountSize(
    programBuffer.length
  );
  const bufferBalance = await conn.getMinimumBalanceForRentExemption(
    bufferSize
  );

  // Decide whether it's an initial deployment or an upgrade and calculate
  // how much SOL user needs before creating the buffer.
  const wallet = PgWallet.current!;
  const userBalance = await conn.getBalance(wallet.publicKey);
  const programExists = await conn.getAccountInfo(programPk);

  if (!programExists) {
    // Initial deploy
    const neededBalance = 3 * bufferBalance;
    if (userBalance < neededBalance) {
      const errMsg = `Initial deployment costs ${PgTerminal.bold(
        PgCommon.lamportsToSol(neededBalance).toFixed(2)
      )} SOL but you have ${PgTerminal.bold(
        PgCommon.lamportsToSol(userBalance).toFixed(2)
      )} SOL. ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgCommon.getAirdropAmount(conn.rpcEndpoint);
      if (airdropAmount !== null) {
        throw new Error(
          errMsg +
            `\nYou can use '${PgTerminal.bold(
              `solana airdrop ${airdropAmount}`
            )}' to airdrop some SOL.`
        );
      } else throw new Error(errMsg);
    }
  } else {
    // Upgrade
    if (userBalance < bufferBalance) {
      const errMsg = `Upgrading costs ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL but you have ${PgTerminal.bold(
        PgCommon.lamportsToSol(userBalance).toFixed(2)
      )} SOL. ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgCommon.getAirdropAmount(conn.rpcEndpoint);
      if (airdropAmount !== null) {
        throw new Error(
          errMsg +
            `\nYou can use '${PgTerminal.bold(
              `solana airdrop ${airdropAmount}`
            )}' to airdrop some SOL.`
        );
      } else throw new Error(errMsg);
    }
  }

  let sleepAmount = 1000;
  // Retry until it's successful or exceeds max tries
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (i !== 0) {
        const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
        if (bufferInit) break;
      }

      await BpfLoaderUpgradeable.createBuffer(
        bufferKp,
        bufferBalance,
        programBuffer.length,
        { wallet }
      );

      // Sleep before getting account info because it fails in localhost
      // if we do it right away
      await PgCommon.sleep(500);

      // Confirm the buffer has been created
      const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
      if (bufferInit) break;
    } catch (e: any) {
      console.log("Create buffer error: ", e.message);
      if (i === MAX_RETRIES - 1)
        throw new Error(
          `Exceeded maximum amount of retries(${PgTerminal.bold(
            MAX_RETRIES.toString()
          )}). Please change RPC endpoint from the settings.`
        );

      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }
  }

  console.log("Buffer pk: " + bufferKp.publicKey.toBase58());

  // Load buffer
  await BpfLoaderUpgradeable.loadBuffer(bufferKp.publicKey, programBuffer, {
    wallet,
  });

  // it errors if we don't wait for the buffer to load
  // `invalid account data for instruction`
  // wait for the next block(~500ms blocktime on mainnet as of 2022-04-05)
  await PgCommon.sleep(500);

  let txHash;
  let errorMsg =
    "Please check the browser console. If the problem persists, you can report the issue in " +
    GITHUB_URL +
    "/issues";
  sleepAmount = 1000;

  // Retry until it's successful or exceeds max tries
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (!programExists) {
        // First deploy needs keypair
        const programKp = PgProgramInfo.kp;
        if (!programKp) {
          errorMsg =
            "Initial deployment needs a keypair, you only provided a public key.";

          break;
        }

        // Check whether customPk and programPk matches
        if (!programKp.publicKey.equals(programPk)) {
          errorMsg = [
            "Entered program id doesn't match program id derived from program's keypair. Initial deployment can only be done from a keypair.",
            "You can fix this in 3 different ways:",
            `1. Remove the custom program id from ${PgTerminal.bold(
              "Program Credentials"
            )}`,
            "2. Import the program keypair for the current program id",
            "3. Create a new program keypair",
          ].join("\n");

          break;
        }

        const programSize = BpfLoaderUpgradeable.getBufferAccountSize(
          BpfLoaderUpgradeable.BUFFER_PROGRAM_SIZE
        );
        const programBalance = await conn.getMinimumBalanceForRentExemption(
          programSize
        );

        txHash = await BpfLoaderUpgradeable.deployProgram(
          bufferKp.publicKey,
          programKp,
          programBalance,
          programBuffer.length * 2,
          { wallet }
        );

        console.log("Deploy Program Tx Hash:", txHash);

        const result = await PgTx.confirm(txHash, conn);
        if (!result?.err) break;

        await BpfLoaderUpgradeable.deployProgram(
          bufferKp.publicKey,
          programKp,
          programBalance,
          programBuffer.length * 2,
          { wallet }
        );
      } else {
        // Upgrade
        txHash = await BpfLoaderUpgradeable.upgradeProgram(
          programPk,
          bufferKp.publicKey,
          wallet.publicKey,
          { wallet }
        );

        console.log("Upgrade Program Tx Hash:", txHash);

        const result = await PgTx.confirm(txHash, conn);
        if (!result?.err) break;

        txHash = await BpfLoaderUpgradeable.upgradeProgram(
          programPk,
          bufferKp.publicKey,
          wallet.publicKey,
          { wallet }
        );
      }
    } catch (e: any) {
      console.log(e.message);
      if (e.message.endsWith("0x0")) {
        await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey, { wallet });

        throw new Error("Incorrect program id.");
      } else if (e.message.endsWith("0x1")) {
        // Not enough balance
        await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey, { wallet });

        throw new Error(
          "Make sure you have enough SOL to complete the deployment."
        );
      }

      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }
  }

  // Most likely the user doesn't have the upgrade authority
  if (!txHash) {
    await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey, { wallet });

    throw new Error(errorMsg);
  }

  return txHash;
};
