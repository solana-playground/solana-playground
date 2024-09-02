import Bundlr from "@bundlr-network/client";

import { BundlrEnpoints } from "../../constants";
import { Emoji } from "../../../../constants";
import {
  PgConnection,
  PgSettings,
  PgTerminal,
  PgWallet,
  PgWeb3,
} from "../../../../utils/pg";

enum BundlrAction {
  Balance = 0,
  Withraw = 1,
}

// The minimum amount of lamports required for withdraw
const LIMIT = 5000;

export const processBundlr = async (
  rpcUrl: string = PgSettings.connection.endpoint,
  action: BundlrAction
) => {
  // Get balance
  PgTerminal.log(
    `${BundlrAction.Withraw ? "[1/2]" : "[1/1]"} ${
      Emoji.COMPUTER
    } Retrieving balance`
  );

  const pkStr = PgWallet.current!.publicKey.toBase58();

  const cluster = await PgConnection.getCluster(rpcUrl);
  const bundlr = new Bundlr(
    cluster === "mainnet-beta" ? BundlrEnpoints.MAINNET : BundlrEnpoints.DEVNET,
    "solana",
    PgWallet,
    { providerUrl: rpcUrl }
  );

  const balance = await bundlr.getBalance(pkStr);

  PgTerminal.log("\nFunding address:");
  PgTerminal.log(`  -> pubkey: ${pkStr}`);
  PgTerminal.log(
    `  -> lamports: ${balance} (${Emoji.SOL} ${balance.div(
      PgWeb3.LAMPORTS_PER_SOL
    )})`
  );

  // Withdraw funds
  if (action === BundlrAction.Withraw) {
    PgTerminal.log(`\n${"[2/2]"} ${Emoji.WITHDRAW} Withdrawing funds`);

    if (balance.isZero()) {
      PgTerminal.log!("\nNo funds to withdraw.");
    } else if (balance.minus(LIMIT).gt(0)) {
      const withdrawBalance = balance.minus(LIMIT);
      const response = await bundlr.withdrawBalance(withdrawBalance);

      if (response.status === 200) {
        PgTerminal.log("Withdraw completed.");
      } else {
        PgTerminal.log(`\n${PgTerminal.error("Withdraw failed.")}`);
        throw new Error(`Failed to complete withdraw (${response.data})`);
      }
    } else {
      PgTerminal.log(
        `\n${PgTerminal.error("Insufficient balance for withdraw:")}`
      );
      PgTerminal.log(
        `  -> required balance > ${LIMIT.toString()} (${Emoji.SOL} ${
          LIMIT / PgWeb3.LAMPORTS_PER_SOL
        })`
      );
    }
  }
};
