import { Dispatch, SetStateAction } from "react";
import { Buffer } from "buffer";
import { Connection, Keypair } from "@solana/web3.js";

import { BpfLoaderUpgradeable } from "../bpf-upgradeable-browser";
import { GITHUB_URL, SERVER_URL } from "../../constants";
import { PgProgramInfo } from "./program-info";
import { PgCommon } from "./common";
import { PgWallet } from "./wallet";

export class PgDeploy {
  static async deploy(
    conn: Connection,
    wallet: PgWallet,
    setProgress: Dispatch<SetStateAction<number>>,
    programBuffer: Buffer
  ) {
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

    await BpfLoaderUpgradeable.createBuffer(
      conn,
      wallet,
      bufferKp,
      bufferBalance,
      programBuffer.length
    );

    console.log("Buffer pk: " + bufferKp.publicKey.toBase58());

    // Confirm the buffer has been created
    let tries = 0;
    while (1) {
      const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
      if (bufferInit) break;

      // Retry again every 5 tries
      if (tries % 5)
        await BpfLoaderUpgradeable.createBuffer(
          conn,
          wallet,
          bufferKp,
          bufferBalance,
          programBuffer.length
        );

      await PgCommon.sleep(2000);
    }

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

    // Get program pubkey
    let programPk;
    try {
      programPk = PgProgramInfo.getCustomPk();
    } catch (e: any) {
      // Invalid public key
      // This shouldn't happen unless the user manually changes localStorage
      await BpfLoaderUpgradeable.closeBuffer(conn, wallet, bufferKp.publicKey);

      throw new Error(e.message);
    }

    // Get program kp
    let programKp;
    if (!programPk) {
      const programKpResult = PgProgramInfo.getKp();
      if (programKpResult?.err) {
        await BpfLoaderUpgradeable.closeBuffer(
          conn,
          wallet,
          bufferKp.publicKey
        );

        throw new Error(programKpResult.err);
      }

      programKp = programKpResult.programKp!;
      programPk = programKp.publicKey;
    } else {
      console.log("using customPk");
    }

    let txHash;

    // Retry until it's successful or exceeds max tries
    for (let i = 0; i < 10; i++) {
      try {
        // Decide whether it's an initial deployment or an upgrade
        const programExists = await conn.getAccountInfo(programPk);

        if (!programExists) {
          if (!programKp) {
            await BpfLoaderUpgradeable.closeBuffer(
              conn,
              wallet,
              bufferKp.publicKey
            );

            throw new Error(
              "First deployment needs a keypair. You only provided public key."
            );
          }

          // Deploy
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

          const result = await conn.confirmTransaction(txHash);
          if (!result?.value.err) break;
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

          const result = await conn.confirmTransaction(txHash);
          if (!result?.value.err) break;
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
        if (e.message.endsWith("0x1")) {
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

        await PgCommon.sleep(2000);
      }
    }

    // Most likely the user doesn't have the upgrade authority
    if (!txHash) {
      await BpfLoaderUpgradeable.closeBuffer(conn, wallet, bufferKp.publicKey);

      throw new Error(
        "Unknown error. Please check the browser console. You can report the issue in " +
          GITHUB_URL +
          "/issues"
      );
    }

    return txHash;
  }
}
