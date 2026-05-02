import {
  Cluster,
  PgCommand,
  PgCommon,
  PgConnection,
  PgSettings,
  PgWallet,
} from "../../utils";

export const automaticAirdrop = () => {
  return PgCommon.batchChanges(async () => {
    if (!PgSettings.wallet.automaticAirdrop) return;

    // If there was an error, disable the effect
    const cluster = PgConnection.cluster;
    if (!cluster || errorCache.has(cluster)) return;

    // Need the current account balance to decide the airdrop
    if (typeof PgWallet.balance !== "number") return;

    // Get airdrop amount based on network (in SOL)
    const airdropAmount = PgConnection.getAirdropAmount();
    if (!airdropAmount) return;

    // Only airdrop if the balance is less than the airdrop amount
    if (PgWallet.balance >= airdropAmount) return;

    // Execute the `airdrop` command (handles the default amount)
    try {
      await PgCommand.airdrop.execute();
    } catch (e) {
      errorCache.add(cluster);
      throw e;
    }
  }, [
    PgWallet.onDidChangeBalance,
    PgSettings.onDidChangeWalletAutomaticAirdrop,
  ]);
};

const errorCache = new Set<Cluster>();
