import {
  Cluster,
  PgCommand,
  PgCommon,
  PgConnection,
  PgSettings,
  PgWallet,
} from "../../utils";

export const automaticAirdrop = () => {
  return PgCommon.batchChanges(
    PgCommon.executeInOrder(async () => {
      if (!PgSettings.wallet.automaticAirdrop) return;

      // If there was an error, disable the effect
      const cluster = PgConnection.cluster;
      if (!cluster || errorCache.has(cluster)) return;

      // Get airdrop amount based on network (in SOL)
      const airdropAmount = PgConnection.getAirdropAmount();
      if (!airdropAmount) return;

      // Need the current account balance to decide the airdrop
      const initialBalance = PgWallet.balance;
      if (typeof initialBalance !== "number") return;

      // Only airdrop if the balance is less than the airdrop amount
      if (initialBalance >= airdropAmount) return;

      // Execute the `airdrop` command (handles the default amount)
      try {
        await PgCommand.airdrop.execute();
      } catch (e) {
        errorCache.add(cluster);
        throw e;
      }
    }),
    [PgWallet.onDidChangeBalance, PgSettings.onDidChangeWalletAutomaticAirdrop]
  );
};

const errorCache = new Set<Cluster>();
