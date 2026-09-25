import {
  Cluster,
  Disposable,
  PgCommand,
  PgCommon,
  PgConnection,
  PgSettings,
  PgTerminal,
  PgWallet,
} from "../../utils";

export const automaticAirdrop = () => {
  const disposables: Disposable[] = [];

  let isDeploying = false;
  disposables.push(PgCommand.deploy.onDidStart(() => (isDeploying = true)));
  disposables.push(PgCommand.deploy.onDidFinish(() => (isDeploying = false)));

  const airdrop = PgCommon.batchChanges(
    // TODO: Should every batch request be executed sequentially?
    PgCommon.executeSequential(async () => {
      if (!PgSettings.wallet.automaticAirdrop) return;

      // Skip if there was an error
      const cluster = PgConnection.cluster;
      if (!cluster || errorCache.has(cluster)) return;

      // Skip during deployment because automatic airdrop might conflict with it
      if (isDeploying) return;

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
      } catch {
        errorCache.add(cluster);
        PgTerminal.println(
          [
            "Note: This was an automatic airdrop request.",
            `To disable, run \`${PgCommand.setting.name} set wallet.automaticAirdrop false\`.`,
          ].join(" ")
        );
      }
    }),
    [PgWallet.onDidChangeBalance, PgSettings.onDidChangeWalletAutomaticAirdrop]
  );
  disposables.push(airdrop);

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};

const errorCache = new Set<Cluster>();
