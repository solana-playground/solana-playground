import {
  PgCommand,
  PgCommon,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgServer,
  PgTerminal,
  PgTx,
  PgView,
  PgWallet,
  PgWeb3,
} from "../../utils";
import { createCmd } from "../create";
import { BpfLoaderUpgradeable } from "./bpf-loader-upgradeable";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  handle: async () => {
    PgGlobal.update({ deployState: "loading" });

    PgTerminal.println(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    PgView.setMainSecondaryProgress(0.1);

    try {
      const startTime = performance.now();
      const { txHash, closeBuffer } = await processDeploy();
      let msg;
      if (txHash) {
        const timePassed = (performance.now() - startTime) / 1000;
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
          msg = PgTerminal.success("Reclaim successful.");
        } else {
          msg = `${PgTerminal.error(
            "Reclaim rejected."
          )} Run \`solana program close --buffers\` to close unused buffer accounts and reclaim SOL.`;
        }
      }

      PgTerminal.println(msg + "\n");
    } finally {
      PgView.setMainSecondaryProgress(0);
      PgGlobal.update({ deployState: "ready" });
    }
  },
  preCheck: [checkWallet, checkProgram],
});

/** Check whether the wallet is connected (playground or standard). */
async function checkWallet() {
  if (!PgWallet.current) {
    PgTerminal.println("Warning: Wallet is not connected.");
    PgTerminal.println(PgTerminal.info("Connecting..."));

    const needsSetup = PgWallet.state === "setup";
    const connected = await PgCommand.connect.execute();
    if (!connected) throw new Error("Wallet must be connected.");

    PgTerminal.println("");

    // When it's the first ever deployment, add extra sleep to give time for
    // the automatic airdrop request to confirm
    if (needsSetup) await PgCommon.sleep(2000);
  }
}

/** Check whether the state is valid for deployment. */
async function checkProgram() {
  if (!PgProgramInfo.uuid && !PgProgramInfo.importedProgram?.buffer.length) {
    PgTerminal.println("Warning: Program is not built.");
    await PgCommand.build.execute();
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

/** Deploy the current program. */
const processDeploy = async () => {
  const programPk = PgProgramInfo.pk!;
  const programBuffer =
    PgProgramInfo.importedProgram?.buffer ??
    (await PgServer.deploy(PgProgramInfo.uuid!));
  const programLen = programBuffer.length;

  const connection = PgConnection.current;
  const programExists = await connection.getAccountInfo(programPk);

  // Initial deploy checks
  const programKp = PgProgramInfo.kp;
  if (!programExists) {
    if (!programKp) {
      throw new Error(
        "Initial deployment needs a keypair but you've only provided a public key."
      );
    }

    if (!programKp.publicKey.equals(programPk)) {
      throw new Error(
        [
          "Entered program id doesn't match the program id derived from program's keypair.",
          "You can fix this in 3 different ways:",
          `1. Remove the custom program id from ${PgTerminal.bold(
            "Program ID"
          )}`,
          "2. Import the program keypair for the current program id",
          "3. Create a new program keypair",
        ].join("\n")
      );
    }
  }

  const wallet = PgWallet.current!;
  const [pgWallet, standardWallet] = wallet.isPg
    ? [wallet, null]
    : [PgWallet.create(PgWallet.accounts[0]), wallet];

  // Decide whether it's an initial deployment or an upgrade and calculate
  // how much SOL user needs before creating the buffer.
  const [userBalance, bufferBalance] = await Promise.all([
    connection.getBalance(wallet.publicKey),
    connection.getMinimumBalanceForRentExemption(
      PgWeb3.BpfLoaderUpgradeableProgram.getBufferAccountSize(programLen)
    ),
  ]);

  // Balance required to deploy/upgrade (without fees)
  const requiredBalanceWithoutFees = programExists
    ? bufferBalance
    : 3 * bufferBalance;
  if (userBalance < requiredBalanceWithoutFees) {
    const msg = `${
      programExists ? "Upgrading" : "Initial deployment"
    } costs ${PgTerminal.bold(
      PgCommon.lamportsToSol(requiredBalanceWithoutFees).toFixed(2)
    )} SOL but you have ${PgTerminal.bold(
      PgCommon.lamportsToSol(userBalance).toFixed(2)
    )} SOL. ${PgTerminal.bold(
      PgCommon.lamportsToSol(bufferBalance).toFixed(2)
    )} SOL will be refunded at the end.`;
    const airdropAmount = PgConnection.getAirdropAmount();
    if (airdropAmount === null) throw new Error(msg);

    const term = await PgTerminal.get();
    term.println(`Warning: ${msg}`);
    const confirmed = await term.waitForUserInput(
      "You don't have enough SOL to complete the deployment. Would you like to request an airdrop?",
      { confirm: true, default: "yes" }
    );
    if (!confirmed) throw new Error("Insufficient balance");

    await PgCommand.solana.execute("airdrop", airdropAmount.toString());
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
    await sendAndConfirmTxWithRetries(
      () => PgTx.send(transferIx),
      async () => {
        const currentBalance = await connection.getBalance(
          standardWallet.publicKey
        );
        return currentBalance < userBalance - requiredBalance;
      }
    );
  }

  // Create buffer
  const bufferKp = PgWeb3.Keypair.generate();
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
    return await sendAndConfirmTxWithRetries(
      async () => {
        return await BpfLoaderUpgradeable.closeBuffer(bufferKp.publicKey, {
          wallet: pgWallet,
        });
      },
      async () => {
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        return !bufferAcc;
      }
    );
  };

  // Load buffer
  const loadBufferResult = await loadBufferWithControl(
    bufferKp.publicKey,
    programBuffer,
    {
      wallet: pgWallet,
      onWrite: (offset) =>
        PgView.setMainSecondaryProgress((offset / programLen) * 100),
      onMissing: (missingCount) => {
        PgTerminal.println(
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
  if (loadBufferResult.cancelled) return { closeBuffer };

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
  try {
    const txHash = await sendAndConfirmTxWithRetries(
      async () => {
        if (programExists) {
          return await BpfLoaderUpgradeable.upgradeProgram(
            programPk,
            bufferKp.publicKey
          );
        }

        const programSize =
          PgWeb3.BpfLoaderUpgradeableProgram.getBufferAccountSize(
            PgWeb3.BpfLoaderUpgradeableProgram.PROGRAM_ACCOUNT_SIZE
          );
        const programBalance =
          await connection.getMinimumBalanceForRentExemption(programSize);

        return await BpfLoaderUpgradeable.deployProgram(
          programKp!,
          bufferKp.publicKey,
          programBalance,
          programLen * 2
        );
      },
      async () => {
        const bufferAcc = await connection.getAccountInfo(bufferKp.publicKey);
        return !bufferAcc;
      }
    );
    return { txHash };
  } catch (e) {
    await closeBuffer();
    throw e;
  }
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
 * `checkConfirmation` is necessary because `PgTx.confirm` can be unreliable.
 *
 * @param sendTx send transaction callback
 * @param checkConfirmation only confirm the transaction if this callback returns truthy
 * @returns the transaction signature
 */
const sendAndConfirmTxWithRetries = async (
  sendTx: () => Promise<string>,
  checkConfirmation: () => Promise<boolean>
) => {
  const MAX_RETRIES = 5;
  const SLEEP_MULTIPLIER = 1.8;

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
