import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { GITHUB_URL } from "../../constants";
import { BpfLoaderUpgradeable } from "../../utils/bpf-upgradeable-browser";
import {
  PgCommand,
  PgCommon,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgServer,
  PgTerminal,
  PgTx,
  PgWallet,
} from "../../utils/pg";
import { createCmd } from "../create";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  run: async () => {
    PgGlobal.update({ deployState: "loading" });

    PgTerminal.log(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    PgTerminal.setProgress(0.1);

    let msg;
    try {
      const startTime = performance.now();
      const { txHash, closeBuffer } = await processDeploy();
      if (txHash) {
        const timePassed = (performance.now() - startTime) / 1000;
        PgTx.notify(txHash);

        msg = `${PgTerminal.success(
          "Deployment successful."
        )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
      } else if (closeBuffer) {
        const term = await PgTerminal.get();
        const shouldCloseBufferAccount = await term.waitForUserInput(
          PgTerminal.warning("Cancelled deployment.") +
            " Would you like to close the buffer account and reclaim SOL?",
          { confirm: true, default: "yes" }
        );
        if (shouldCloseBufferAccount) {
          await closeBuffer();
          PgTerminal.log(PgTerminal.success("Reclaim successful."));
        } else {
          PgTerminal.log(
            `${PgTerminal.error(
              "Reclaim rejected."
            )} Run \`solana program close --buffers\` to close unused buffer accounts and reclaim SOL.`
          );
        }
      }
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
      return 1; // To indicate error
    } finally {
      if (msg) PgTerminal.log(msg + "\n");
      PgTerminal.setProgress(0);
      PgGlobal.update({ deployState: "ready" });
    }
  },
  preCheck: [checkWallet, checkDeploy],
});

/** Check whether the wallet is connected (playground or standard). */
async function checkWallet() {
  if (!PgWallet.current) {
    throw new Error(
      `Wallet must be connected to run this command. Run \`${PgTerminal.bold(
        PgCommand.connect.name
      )}\` to connect.`
    );
  }
}

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
const SLEEP_MULTIPLIER = 1.8;

/**
 * Deploy the current program.
 *
 * @returns the deployment transaction signature if the deployment succeeds
 */
const processDeploy = async () => {
  const programPk = PgProgramInfo.pk;
  if (!programPk) throw new Error("Program id not found.");

  // Regular deploy without custom elf upload
  let programBuffer = PgProgramInfo.importedProgram?.buffer;
  if (!programBuffer?.length) {
    if (!PgProgramInfo.uuid) throw new Error("Program is not built.");
    programBuffer = await PgServer.deploy(PgProgramInfo.uuid);
  }

  // Get connection
  const connection = PgConnection.current;

  // Create buffer
  const bufferKp = Keypair.generate();
  const programLen = programBuffer.length;
  const bufferSize = BpfLoaderUpgradeable.getBufferAccountSize(programLen);
  const bufferBalance = await connection.getMinimumBalanceForRentExemption(
    bufferSize
  );

  const wallet = PgWallet.current!;
  const [pgWallet, standardWallet] = wallet.isPg
    ? [wallet, null]
    : [PgWallet.createWallet(PgWallet.accounts[0]), wallet];

  // Decide whether it's an initial deployment or an upgrade and calculate
  // how much SOL user needs before creating the buffer.
  const [programExists, userBalance] = await Promise.all([
    connection.getAccountInfo(programPk),
    connection.getBalance(wallet.publicKey),
  ]);

  // Balance required to deploy/upgrade (without fees)
  let requiredBalanceWithoutFees;
  if (!programExists) {
    // Initial deploy
    requiredBalanceWithoutFees = 3 * bufferBalance;
    if (userBalance < requiredBalanceWithoutFees) {
      const errMsg = `Initial deployment costs ${PgTerminal.bold(
        PgCommon.lamportsToSol(requiredBalanceWithoutFees).toFixed(2)
      )} SOL but you have ${PgTerminal.bold(
        PgCommon.lamportsToSol(userBalance).toFixed(2)
      )} SOL. ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgCommon.getAirdropAmount(connection.rpcEndpoint);
      if (airdropAmount !== null) {
        throw new Error(
          errMsg +
            `\nYou can use '${PgTerminal.bold(
              `solana airdrop ${airdropAmount}`
            )}' to airdrop some SOL.`
        );
      }

      throw new Error(errMsg);
    }
  } else {
    // Upgrade
    requiredBalanceWithoutFees = bufferBalance;
    if (userBalance < bufferBalance) {
      const errMsg = `Upgrading costs ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL but you have ${PgTerminal.bold(
        PgCommon.lamportsToSol(userBalance).toFixed(2)
      )} SOL. ${PgTerminal.bold(
        PgCommon.lamportsToSol(bufferBalance).toFixed(2)
      )} SOL will be refunded at the end.`;

      const airdropAmount = PgCommon.getAirdropAmount(connection.rpcEndpoint);
      if (airdropAmount !== null) {
        throw new Error(
          errMsg +
            `\nYou can use '${PgTerminal.bold(
              `solana airdrop ${airdropAmount}`
            )}' to airdrop some SOL.`
        );
      }

      throw new Error(errMsg);
    }
  }

  let sleepAmount = 1000;

  // If deploying from a standard wallet, transfer the required lamports for
  // deployment to the first playground wallet, which allows to deploy without
  // asking for approval.
  if (standardWallet) {
    // Transfer extra 0.1 SOL for fees (doesn't have to get used)
    const requiredBalance = requiredBalanceWithoutFees + LAMPORTS_PER_SOL / 10;
    const transferIx = SystemProgram.transfer({
      fromPubkey: standardWallet.publicKey,
      toPubkey: pgWallet.publicKey,
      lamports: requiredBalance,
    });
    const transferTx = new Transaction().add(transferIx);

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        if (i !== 0) {
          const currentBalance = await connection.getBalance(
            standardWallet.publicKey
          );
          if (currentBalance < userBalance - requiredBalance) break;
        }

        const txHash = await PgTx.send(transferTx);
        await PgTx.confirm(txHash);

        break;
      } catch (e: any) {
        console.log("Transfer to standard wallet error:", e.message);
        if (i === MAX_RETRIES - 1) {
          throw new Error(
            `Exceeded maximum amount of retries(${PgTerminal.bold(
              MAX_RETRIES.toString()
            )}) to transfer the required lamports for deployment. \
Please change RPC endpoint from the settings.
Reason: ${e.message}`
          );
        }

        await PgCommon.sleep(sleepAmount);
        sleepAmount *= SLEEP_MULTIPLIER;
      }
    }
  }

  // Retry until it's successful or exceeds max tries
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (i !== 0) {
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        if (bufferAcc) break;
      }

      const txHash = await BpfLoaderUpgradeable.createBuffer(
        bufferKp,
        bufferBalance,
        programLen,
        { wallet: pgWallet }
      );
      await PgTx.confirm(txHash);
    } catch (e: any) {
      console.log("Create buffer error:", e.message);
      if (i === MAX_RETRIES - 1) {
        throw new Error(
          `Exceeded maximum amount of retries(${PgTerminal.bold(
            MAX_RETRIES.toString()
          )}) to create the program buffer account. \
Please change RPC endpoint from the settings.
Reason: ${e.message}`
        );
      }

      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }
  }

  console.log("Buffer pk:", bufferKp.publicKey.toBase58());
  const closeBuffer = () =>
    BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey);

  // Load buffer
  const loadBufferResult = await loadBufferWithControl(
    bufferKp.publicKey,
    programBuffer,
    {
      wallet: pgWallet,
      onWrite: (offset) => PgTerminal.setProgress((offset / programLen) * 100),
      onMissing: (missingCount) => {
        PgTerminal.log(
          `Warning: ${PgTerminal.bold(
            missingCount.toString()
          )} ${PgCommon.makePlural(
            "transaction",
            missingCount
          )} not confirmed, retrying...`
        );
      },
    }
  );
  if (loadBufferResult.cancelled) {
    return {
      closeBuffer: async () => {
        await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey, {
          wallet: pgWallet,
        });
      },
    };
  }

  // If deploying from a standard wallet, transfer the buffer authority
  // to the standard wallet before deployment, otherwise it doesn't
  // pass on-chain checks.
  if (standardWallet) {
    sleepAmount = 1000;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Verify buffer authority is not already set to the standard wallet
        if (i !== 0) {
          const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
          const isBufferAuthority = bufferAcc?.data
            .slice(5, 37)
            .equals(standardWallet.publicKey.toBuffer());
          if (isBufferAuthority) break;
        }

        const txHash = await BpfLoaderUpgradeable.setBufferAuthority(
          bufferKp.publicKey,
          standardWallet.publicKey,
          { wallet: pgWallet }
        );
        await PgTx.confirm(txHash);
      } catch (e: any) {
        console.log("Set buffer authority error:", e.message);
        if (i === MAX_RETRIES - 1) {
          await closeBuffer();

          throw new Error(
            `Exceeded maximum amount of retries(${PgTerminal.bold(
              MAX_RETRIES.toString()
            )}) to set the buffer account authority to the current wallet. \
  Please change RPC endpoint from the settings.
  Reason: ${e.message}`
          );
        }

        await PgCommon.sleep(sleepAmount);
        sleepAmount *= SLEEP_MULTIPLIER;
      }
    }
  }

  // Deploy/upgrade
  let txHash: string | undefined;
  let errorMsg =
    "Please check the browser console. If the problem persists, you can report the issue in " +
    GITHUB_URL +
    "/issues";

  // Retry until it's successful or exceeds max tries
  sleepAmount = 1000;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (!programExists) {
        // First deploy needs keypair
        const programKp = PgProgramInfo.kp;
        if (!programKp) {
          errorMsg =
            "Initial deployment needs a keypair but you've only provided a public key.";

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
        const programBalance =
          await connection.getMinimumBalanceForRentExemption(programSize);

        txHash = await BpfLoaderUpgradeable.deployProgram(
          programKp,
          bufferKp.publicKey,
          programBalance,
          programLen * 2
        );
      } else {
        // Upgrade
        txHash = await BpfLoaderUpgradeable.upgradeProgram(
          programPk,
          bufferKp.publicKey
        );
      }

      console.log("Deploy/upgrade tx hash:", txHash);

      const result = await PgTx.confirm(txHash);
      if (!result?.err) {
        // Also check whether the buffer account was closed because
        // `PgTx.confirm` can be unreliable
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        if (!bufferAcc) break;
      }
    } catch (e: any) {
      console.log("Deploy/upgrade error:", e.message);

      if (e.message.endsWith("0x0")) {
        await closeBuffer();

        throw new Error("Incorrect program id.");
      }
      if (e.message.endsWith("0x1")) {
        // Not enough balance
        await closeBuffer();

        throw new Error(
          "Make sure you have enough SOL to complete the deployment."
        );
      }

      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }

    if (i === MAX_RETRIES - 1) {
      await closeBuffer();

      throw new Error(
        `Failed to deploy with ${PgTerminal.bold(
          MAX_RETRIES.toString()
        )} retries.`
      );
    }
  }

  // Most likely the user doesn't have the upgrade authority
  if (!txHash) {
    await closeBuffer();

    throw new Error(errorMsg);
  }

  return { txHash };
};

/** Load buffer with the ability to pause, resume and cancel on demand. */
const loadBufferWithControl = (
  ...args: Parameters<typeof BpfLoaderUpgradeable["loadBuffer"]>
) => {
  return new Promise<
    | {
        cancelled: true;
        success?: never;
      }
    | {
        cancelled?: never;
        success: true;
      }
  >(async (res) => {
    const abortController = new AbortController();
    args[2] = { ...args[2], abortController };

    const term = await PgTerminal.get();
    const handle = async () => {
      if (abortController.signal.aborted) {
        await term.executeFromStr("yes");
      } else {
        abortController.abort();
        const shouldContinue = await term.waitForUserInput(
          "Continue deployment?",
          { confirm: true, default: "yes" }
        );
        dispose();

        if (shouldContinue) {
          PgGlobal.deployState = "loading";
          loadBufferWithControl(...args).then(res);
        } else {
          PgGlobal.deployState = "cancelled";
          res({ cancelled: true });
        }
      }
    };

    let prevState = PgGlobal.deployState;
    const { dispose } = PgGlobal.onDidChangeDeployState((state) => {
      if (
        prevState !== state &&
        (prevState === "paused" || state === "paused")
      ) {
        handle();
      }
      prevState = state;
    });

    await BpfLoaderUpgradeable.loadBuffer(...args);

    if (!abortController.signal.aborted) {
      dispose();
      res({ success: true });
    }
  });
};
