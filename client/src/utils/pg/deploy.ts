import { Connection, Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

import { BpfLoaderUpgradeable } from "../bpf-upgradeable-browser";
import { PgCommon } from "./common";
import { SERVER_URL } from "../../constants";
import { PgProgramInfo } from "./program-info";
import { PgWallet } from "./wallet";

export class PgDeploy {
  static async deploy(conn: Connection, wallet: PgWallet) {
    // Only get the binary if it's not in the localStorage
    const uuid = PgProgramInfo.getProgramInfo().uuid;
    const resp = await fetch(`${SERVER_URL}/deploy/${uuid}`);

    const result = await PgCommon.checkForRespErr(resp);
    if (result?.err) throw new Error(result.err);

    const arrayBuffer = result.arrayBuffer!;

    // Need to convert ArrayBuffer to Buffer
    const programBuffer = Buffer.from(arrayBuffer);

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
    while (1) {
      const bufferInit = await conn.getAccountInfo(bufferKp.publicKey);
      if (bufferInit) break;
      await PgCommon.sleep(1000);
    }

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

    // Decide whether it's an initial deployment or an upgrade
    const programKpResult = PgProgramInfo.getProgramKp();
    if (programKpResult?.err) throw new Error(programKpResult.err);
    const programKp = programKpResult.programKp!;

    const programExists = await conn.getAccountInfo(programKp.publicKey);

    let txHash;

    if (!programExists) {
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
    } else {
      // Upgrade
      txHash = await BpfLoaderUpgradeable.upgradeProgram(
        programKp.publicKey,
        conn,
        wallet,
        bufferKp.publicKey,
        wallet.publicKey
      );

      console.log("Upgrade Program Tx Hash: ", txHash);
    }

    return txHash;
  }
}
