import fetch from "node-fetch";
import { Keypair } from "@solana/web3.js";

import { GITHUB_URL, SERVER_URL } from "../../constants";
import {
  pgChannel,
  PgCommon,
  PgConnection,
  PgFs,
  PgProgramInfo,
  PgTx,
  PgWallet,
} from "../../utils";
import { BpfLoaderUpgradeable } from "./bpf-upgradeable";

const MAX_RETRIES = 10;
const SLEEP_MULTIPLIER = 1.4;

export const processDeploy = async (
  programBuffer: Buffer = Buffer.from([])
) => {
  // Get program data;
  const { programKpUri } = await PgFs.getProgramData();
  const programPk = (await PgProgramInfo.getKeypairFromFs(programKpUri))
    .publicKey;

  // Get connection
  const conn = PgConnection.get();

  // Get wallet
  const walletKp = await PgWallet.getKeypair();

  // Regular deploy without custom elf upload
  if (!programBuffer.length) {
    const uuid = PgProgramInfo.get().uuid;
    const resp = await fetch(`${SERVER_URL}/deploy/${uuid}`);

    const arrayBuffer = await PgCommon.checkForRespErr(resp);

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
  const userBalance = await conn.getBalance(walletKp.publicKey);
  const programExists = await conn.getAccountInfo(programPk);

  if (!programExists) {
    // Initial deploy
    const neededBalance = 3 * bufferBalance;
    if (userBalance < neededBalance) {
      const errMsg = `Initial deployment costs ${PgCommon.lamportsToSol(
        neededBalance
      ).toFixed(2)} SOL but you have ${PgCommon.lamportsToSol(
        userBalance
      ).toFixed(2)} SOL. ${PgCommon.lamportsToSol(bufferBalance).toFixed(
        2
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgConnection.getAirdropAmount();
      if (airdropAmount !== null) {
        throw new Error(
          errMsg + `\nYou can use airdrop command to airdrop some SOL.`
        );
      } else throw new Error(errMsg);
    }
  } else {
    // Upgrade
    if (userBalance < bufferBalance) {
      const errMsg = `Upgrading costs ${PgCommon.lamportsToSol(
        bufferBalance
      ).toFixed(2)} SOL but you have ${PgCommon.lamportsToSol(
        userBalance
      ).toFixed(2)} SOL. ${PgCommon.lamportsToSol(bufferBalance).toFixed(
        2
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgConnection.getAirdropAmount();
      if (airdropAmount !== null) {
        throw new Error(
          errMsg + `\nYou can use airdrop command to airdrop some SOL.`
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
        conn,
        walletKp,
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
      if (i === MAX_RETRIES - 1)
        throw new Error(
          `Exceeded maximum amount of retries(${MAX_RETRIES}). Please change RPC endpoint from the settings.`
        );

      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }
  }

  console.log("Buffer pk: " + bufferKp.publicKey.toBase58());

  // Load buffer
  await BpfLoaderUpgradeable.loadBuffer(
    conn,
    walletKp,
    bufferKp.publicKey,
    programBuffer
  );

  // it errors if we don't wait for the buffer to load
  // `invalid account data for instruction`
  // wait for the next block(~500ms blocktime on mainnet as of 2022-04-05)
  await PgCommon.sleep(500);

  let txHash;
  let errorMsg =
    "Could not deploy. If the problem persists, you can report the issue in " +
    GITHUB_URL +
    "/issues";
  sleepAmount = 1000;

  // Retry until it's successful or exceeds max tries
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (!programExists) {
        // First deploy needs keypair
        const programKp = await PgProgramInfo.getKeypairFromFs(programKpUri);
        if (!programKp) {
          errorMsg =
            "Initial deployment needs a keypair. You only provided public key.";

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
          walletKp,
          bufferKp.publicKey,
          programKp,
          programBalance,
          programBuffer.length * 2
        );

        pgChannel.appendLine(`Deploy Program Tx Hash: ${txHash}`);

        const result = await PgTx.confirm(txHash, conn);
        if (!result?.err) break;

        await BpfLoaderUpgradeable.deployProgram(
          conn,
          walletKp,
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
          walletKp,
          bufferKp.publicKey,
          walletKp.publicKey
        );

        pgChannel.appendLine(`Upgrade Program Tx Hash: ${txHash}`);

        const result = await PgTx.confirm(txHash, conn);
        if (!result?.err) break;

        txHash = await BpfLoaderUpgradeable.upgradeProgram(
          programPk,
          conn,
          walletKp,
          bufferKp.publicKey,
          walletKp.publicKey
        );
      }
    } catch (e: any) {
      console.log(e.message);
      if (e.message.endsWith("0x0")) {
        await BpfLoaderUpgradeable.closeBuffer(
          conn,
          walletKp,
          bufferKp.publicKey
        );

        throw new Error("Incorrect program id.");
      } else if (e.message.endsWith("0x1")) {
        // Not enough balance
        await BpfLoaderUpgradeable.closeBuffer(
          conn,
          walletKp,
          bufferKp.publicKey
        );

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
    await BpfLoaderUpgradeable.closeBuffer(conn, walletKp, bufferKp.publicKey);

    throw new Error(errorMsg);
  }
};
