import { Keypair } from "@solana/web3.js";

import { BpfLoaderUpgradeable } from "../bpf-upgradeable-browser";
import { GITHUB_URL, SERVER_URL } from "../../constants";
import { PgCommon } from "./common";
import { PgConnection } from "./connection";
import { PgProgramInfo } from "./program-info";
import { PgTerminal } from "./terminal";
import { PgTx } from "./tx";
import { PgWallet } from "./wallet";

export class PgDeploy {
  static async deploy(programBuffer: Buffer) {
    // Get program id
    const programPk = PgProgramInfo.getPk();

    // This shouldn't happen because the deploy button is disabled for this condition
    if (!programPk) throw new Error("Program id not found.");

    const wallet = PgWallet;

    // Regular deploy without custom elf upload
    if (!programBuffer.length) {
      const uuid = PgProgramInfo.uuid;
      const resp = await fetch(`${SERVER_URL}/deploy/${uuid}`);

      const arrayBuffer = await PgCommon.checkForRespErr(resp);

      // Need to convert ArrayBuffer to Buffer
      programBuffer = Buffer.from(arrayBuffer);
    }

    // Get connection
    const conn = await PgConnection.get();

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
    for (let i = 0; i < this._MAX_RETRIES; i++) {
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
        if (i === this._MAX_RETRIES - 1)
          throw new Error(
            `Exceeded maximum amount of retries(${PgTerminal.bold(
              this._MAX_RETRIES.toString()
            )}). Please change RPC endpoint from the settings.`
          );

        await PgCommon.sleep(sleepAmount);
        sleepAmount *= this._SLEEP_MULTIPLIER;
      }
    }

    console.log("Buffer pk: " + bufferKp.publicKey.toBase58());

    // Load buffer
    await BpfLoaderUpgradeable.loadBuffer(
      conn,
      wallet,
      bufferKp.publicKey,
      programBuffer
    );

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
    for (let i = 0; i < this._MAX_RETRIES; i++) {
      try {
        if (!programExists) {
          // First deploy needs keypair
          const programKp = PgProgramInfo.kp;
          if (!programKp) {
            errorMsg =
              "Initial deployment needs a keypair. You only provided public key.";

            break;
          }

          // Check whether customPk and programPk matches
          if (!programKp.publicKey.equals(PgProgramInfo.getPk()!)) {
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
            conn,
            wallet,
            bufferKp.publicKey,
            programKp,
            programBalance,
            programBuffer.length * 2
          );

          console.log("Deploy Program Tx Hash:", txHash);

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

          console.log("Upgrade Program Tx Hash:", txHash);

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
        if (e.message.endsWith("0x0")) {
          await BpfLoaderUpgradeable.closeBuffer(
            conn,
            wallet,
            bufferKp.publicKey
          );

          throw new Error("Incorrect program id.");
        } else if (e.message.endsWith("0x1")) {
          // Not enough balance
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
        sleepAmount *= this._SLEEP_MULTIPLIER;
      }
    }

    // Most likely the user doesn't have the upgrade authority
    if (!txHash) {
      await BpfLoaderUpgradeable.closeBuffer(conn, wallet, bufferKp.publicKey);

      throw new Error(errorMsg);
    }

    return txHash;
  }

  /** Maximum amount of transaction retries */
  private static readonly _MAX_RETRIES = 5;

  /** Sleep amount multiplier each time a transaction fails */
  private static readonly _SLEEP_MULTIPLIER = 1.6;
}
