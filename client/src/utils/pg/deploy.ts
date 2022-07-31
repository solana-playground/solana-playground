import { Dispatch, SetStateAction } from "react";
import { Connection, Keypair } from "@solana/web3.js";

import { BpfLoaderUpgradeable } from "../bpf-upgradeable-browser";
import { GITHUB_URL, SERVER_URL } from "../../constants";
import { PgProgramInfo } from "./program-info";
import { PgCommon } from "./common";
import { PgWallet } from "./wallet";
import { PgTerminal } from "./terminal/";
import { PgTx } from "./tx";

export class PgDeploy {
  private static readonly MAX_RETRIES = 10;
  private static readonly SLEEP_MULTIPLIER = 1.5;

  static async deploy(
    conn: Connection,
    wallet: PgWallet,
    setProgress: Dispatch<SetStateAction<number>>,
    programBuffer: Buffer
  ) {
    // Get program id
    const programPk = PgProgramInfo.getPk()?.programPk;
    // This shouldn't happen because the deploy button is disabled in this condition.
    if (!programPk) throw new Error("Invalid program id.");

    // Regular deploy without custom elf upload
    if (!programBuffer.length) {
      const uuid = PgProgramInfo.getProgramInfo().uuid;
      const resp = await fetch(`${SERVER_URL}/deploy/${uuid}`);

      const result = await PgCommon.checkForRespErr(resp);
      if (result?.err) throw new Error(result.err);

      const arrayBuffer = result.arrayBuffer!;

      // Need to convert ArrayBuffer to Buffer
      programBuffer = Buffer.from(arrayBuffer);
    }

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

        const airdropAmount = PgCommon.getAirdropAmount();
        if (airdropAmount !== null) {
          throw new Error(
            errMsg +
              `\nYou can use '${PgTerminal.bold(
                `solana airdrop ${PgCommon.getAirdropAmount()}`
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

        const airdropAmount = PgCommon.getAirdropAmount();
        if (airdropAmount !== null) {
          throw new Error(
            errMsg +
              `\nYou can use '${PgTerminal.bold(
                `solana airdrop ${PgCommon.getAirdropAmount()}`
              )}' to airdrop some SOL.`
          );
        } else throw new Error(errMsg);
      }
    }

    let sleepAmount = 1000;
    // Retry until it's successful or exceeds max tries
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        if (i !== 0) {
          const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
          if (bufferInit) break;
        }

        await BpfLoaderUpgradeable.createBuffer(
          conn,
          wallet,
          bufferKp,
          bufferBalance,
          programBuffer.length
        );

        // Sleep before getting account info because it fails in localhost
        // if we do it right away
        await PgCommon.sleep(500);

        // Confirm the buffer has been created
        const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
        if (bufferInit) break;
      } catch (e: any) {
        console.log("Create buffer error: ", e.message);
        if (i === this.MAX_RETRIES - 1)
          throw new Error(
            `Exceeded maximum amount of retries(${PgTerminal.bold(
              this.MAX_RETRIES.toString()
            )}). Please change RPC endpoint from the settings.`
          );

        await PgCommon.sleep(sleepAmount);
        sleepAmount *= this.SLEEP_MULTIPLIER;
      }
    }

    console.log("Buffer pk: " + bufferKp.publicKey.toBase58());

    // Load buffer
    await BpfLoaderUpgradeable.loadBuffer(
      conn,
      wallet,
      bufferKp.publicKey,
      programBuffer,
      setProgress
    );

    // it errors if we don't wait for the buffer to load
    // `invalid account data for instruction`
    // wait for the next block(~500ms blocktime on mainnet as of 2022-04-05)
    await PgCommon.sleep(500);

    let txHash;
    let errorMsg =
      "Please check the browser console. You can report the issue in " +
      GITHUB_URL +
      "/issues";
    sleepAmount = 1000;

    // Retry until it's successful or exceeds max tries
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        if (!programExists) {
          // First deploy needs keypair
          const programKpResult = PgProgramInfo.getKp();
          if (programKpResult.err) {
            errorMsg =
              "First deployment needs a keypair. You only provided public key.";

            await BpfLoaderUpgradeable.closeBuffer(
              conn,
              wallet,
              bufferKp.publicKey
            );

            break;
          }

          const programKp = programKpResult.programKp!;

          const programSize = BpfLoaderUpgradeable.getBufferAccountSize(
            BpfLoaderUpgradeable.BUFFER_PROGRAM_SIZE
          );
          const programBalance = await conn.getMinimumBalanceForRentExemption(
            programSize
          );

          txHash = await BpfLoaderUpgradeable.deployProgram(
            conn,
            wallet,
            bufferKp.publicKey,
            programKp,
            programBalance,
            programBuffer.length * 2
          );

          console.log("Deploy Program Tx Hash: ", txHash);

          const result = await PgTx.confirm(txHash, conn);
          if (!result?.err) break;

          await BpfLoaderUpgradeable.deployProgram(
            conn,
            wallet,
            bufferKp.publicKey,
            programKp,
            programBalance,
            programBuffer.length * 2
          );
        } else {
          // Upgrade
          txHash = await BpfLoaderUpgradeable.upgradeProgram(
            programPk,
            conn,
            wallet,
            bufferKp.publicKey,
            wallet.publicKey
          );

          console.log("Upgrade Program Tx Hash: ", txHash);

          const result = await PgTx.confirm(txHash, conn);
          if (!result?.err) break;

          txHash = await BpfLoaderUpgradeable.upgradeProgram(
            programPk,
            conn,
            wallet,
            bufferKp.publicKey,
            wallet.publicKey
          );
        }
      } catch (e: any) {
        console.log(e.message);
        // Not enough balance
        if (e.message.endsWith("0x0")) {
          await BpfLoaderUpgradeable.closeBuffer(
            conn,
            wallet,
            bufferKp.publicKey
          );

          throw new Error("Incorrect program id.");
        } else if (e.message.endsWith("0x1")) {
          // Close buffer
          await BpfLoaderUpgradeable.closeBuffer(
            conn,
            wallet,
            bufferKp.publicKey
          );

          throw new Error(
            "Make sure you have enough SOL to complete the deployment."
          );
        }

        await PgCommon.sleep(sleepAmount);
        sleepAmount *= this.SLEEP_MULTIPLIER;
      }
    }

    // Most likely the user doesn't have the upgrade authority
    if (!txHash) {
      await BpfLoaderUpgradeable.closeBuffer(conn, wallet, bufferKp.publicKey);

      throw new Error(errorMsg);
    }

    return txHash;
  }
}
