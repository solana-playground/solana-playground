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
  PgWeb3,
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
  preCheck: [checkWallet, checkProgram],
});

/** Check whether the wallet is connected (playground or standard). */
async function checkWallet() {
  if (!PgWallet.current) {
    PgTerminal.log("Warning: Wallet is not connected.");
    PgTerminal.log(PgTerminal.info("Connecting..."));

    const needsSetup = PgWallet.state === "setup";
    const connected = await PgCommand.connect.run();
    if (!connected) throw new Error("Wallet must be connected.");

    PgTerminal.log("");

    // When it's the first ever deployment, add extra sleep to give time for
    // the automatic airdrop request to confirm
    if (needsSetup) await PgCommon.sleep(2000);
  }
}

/** Check whether the state is valid for deployment. */
async function checkProgram() {
  if (!PgProgramInfo.uuid && !PgProgramInfo.importedProgram?.buffer.length) {
    PgTerminal.log("Warning: Program is not built.");
    await PgCommand.build.run();
  }

  if (!PgProgramInfo.pk) {
    throw new Error(
      "Program ID not found. Go to 'Build & Deploy' tab and set the program ID."
    );
  }

  if (!PgProgramInfo.onChain) {
    throw new Error(
      `Could not fetch on-chain data. Try using a different RPC provider with '${PgTerminal.bold(
        "solana config set -u <RPC_URL>"
      )}' command.`
    );
  }

  if (!PgProgramInfo.onChain.upgradable) {
    throw new Error("The program is not upgradable.");
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
  const programPk = PgProgramInfo.pk!;
  const programBuffer =
    PgProgramInfo.importedProgram?.buffer ??
    (await PgServer.deploy(PgProgramInfo.uuid!));

  // Get connection
  const connection = PgConnection.current;

  // Create buffer
  const bufferKp = PgWeb3.Keypair.generate();
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
  const requiredBalanceWithoutFees = programExists
    ? bufferBalance
    : 3 * bufferBalance;
  if (userBalance < requiredBalanceWithoutFees) {
    const airdropAmount = PgCommon.getAirdropAmount(connection.rpcEndpoint);
    if (airdropAmount !== null) {
      const term = await PgTerminal.get();
      const msg = programExists
        ? `Initial deployment costs ${PgTerminal.bold(
            PgCommon.lamportsToSol(requiredBalanceWithoutFees).toFixed(2)
          )} SOL but you have ${PgTerminal.bold(
            PgCommon.lamportsToSol(userBalance).toFixed(2)
          )} SOL. ${PgTerminal.bold(
            PgCommon.lamportsToSol(bufferBalance).toFixed(2)
          )} SOL will be refunded at the end.`
        : `Upgrading costs ${PgTerminal.bold(
            PgCommon.lamportsToSol(bufferBalance).toFixed(2)
          )} SOL but you have ${PgTerminal.bold(
            PgCommon.lamportsToSol(userBalance).toFixed(2)
          )} SOL. ${PgTerminal.bold(
            PgCommon.lamportsToSol(bufferBalance).toFixed(2)
          )} SOL will be refunded at the end.`;
      term.println(`Warning: ${msg}`);
      const confirmed = await term.waitForUserInput(
        "You don't have enough SOL to complete the deployment. Would you like to request an airdrop?",
        { confirm: true, default: "yes" }
      );
      if (!confirmed) throw new Error("Insufficient balance");

      await PgCommand.solana.run("airdrop", airdropAmount.toString());
    }
  }

  // If deploying from a standard wallet, transfer the required lamports for
  // deployment to the first playground wallet, which allows to deploy without
  // asking for approval.
  if (standardWallet) {
    // Transfer extra 0.1 SOL for fees (doesn't have to get used)
    const requiredBalance =
      requiredBalanceWithoutFees + PgWeb3.LAMPORTS_PER_SOL / 10;
    const transferIx = PgWeb3.SystemProgram.transfer({
      fromPubkey: standardWallet.publicKey,
      toPubkey: pgWallet.publicKey,
      lamports: requiredBalance,
    });
    const transferTx = new PgWeb3.Transaction().add(transferIx);
    await sendAndConfirmTxWithRetries(
      () => PgTx.send(transferTx),
      async () => {
        const currentBalance = await connection.getBalance(
          standardWallet.publicKey
        );
        return currentBalance < userBalance - requiredBalance;
      }
    );
  }

  // Create buffer
  await sendAndConfirmTxWithRetries(
    async () => {
      return await BpfLoaderUpgradeable.createBuffer(
        bufferKp,
        bufferBalance,
        programLen,
        { wallet: pgWallet }
      );
    },
    async () => {
      const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
      return !!bufferAcc;
    }
  );

  console.log("Buffer pk:", bufferKp.publicKey.toBase58());
  const closeBuffer = async () => {
    await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey);
  };

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
    await sendAndConfirmTxWithRetries(
      async () => {
        return await BpfLoaderUpgradeable.setBufferAuthority(
          bufferKp.publicKey,
          standardWallet.publicKey,
          { wallet: pgWallet }
        );
      },
      async () => {
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        const isBufferAuthority = bufferAcc?.data
          .slice(5, 37)
          .equals(standardWallet.publicKey.toBuffer());
        return !!isBufferAuthority;
      }
    );
  }

  // Deploy/upgrade
  let txHash;
  try {
    txHash = await sendAndConfirmTxWithRetries(
      async () => {
        if (!programExists) {
          // First deploy needs keypair
          const programKp = PgProgramInfo.kp;
          if (!programKp) {
            // TODO: Break out of the retries
            throw new Error(
              "Initial deployment needs a keypair but you've only provided a public key."
            );
          }

          // Check whether customPk and programPk matches
          if (!programKp.publicKey.equals(programPk)) {
            // TODO: Break out of the retries
            throw new Error(
              [
                "Entered program id doesn't match program id derived from program's keypair. Initial deployment can only be done from a keypair.",
                "You can fix this in 3 different ways:",
                `1. Remove the custom program id from ${PgTerminal.bold(
                  "Program Credentials"
                )}`,
                "2. Import the program keypair for the current program id",
                "3. Create a new program keypair",
              ].join("\n")
            );
          }

          const programSize = BpfLoaderUpgradeable.getBufferAccountSize(
            BpfLoaderUpgradeable.BUFFER_PROGRAM_SIZE
          );
          const programBalance =
            await connection.getMinimumBalanceForRentExemption(programSize);

          return await BpfLoaderUpgradeable.deployProgram(
            programKp,
            bufferKp.publicKey,
            programBalance,
            programLen * 2
          );
        } else {
          // Upgrade
          return await BpfLoaderUpgradeable.upgradeProgram(
            programPk,
            bufferKp.publicKey
          );
        }
      },
      async () => {
        // Also check whether the buffer account was closed because
        // `PgTx.confirm` can be unreliable
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        return !bufferAcc;
      }
    );
  } catch (e) {
    await closeBuffer();
    throw e;
  }

  console.log("Deploy/upgrade tx hash:", txHash);

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

/**
 * Send and confirm transaction with retries based on `checkConfirmation`
 * condition.
 *
 * @param sendTx send transaction callback
 * @param checkConfirmation only confirm the transaction if this callback returns truthy
 * @returns the transaction signature
 */
const sendAndConfirmTxWithRetries = async (
  sendTx: () => Promise<string>,
  checkConfirmation: () => Promise<boolean>
) => {
  let sleepAmount = 1000;
  let errMsg;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const txHash = await sendTx();
      const result = await PgTx.confirm(txHash);
      if (!result?.err) return txHash;
      if (await checkConfirmation()) return txHash;
    } catch (e: any) {
      errMsg = e.message;
      console.log(errMsg);
      await PgCommon.sleep(sleepAmount);
      sleepAmount *= SLEEP_MULTIPLIER;
    }
  }

  throw new Error(
    `Exceeded maximum amount of retries (${PgTerminal.bold(
      MAX_RETRIES.toString()
    )}).
This might be an RPC related issue. Consider changing the endpoint from the settings.
Reason: ${errMsg}`
  );
};
