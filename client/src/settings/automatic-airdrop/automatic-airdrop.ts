import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const automaticAirdrop = createSetting({
  name: "Automatic airdrop",
  tooltip: {
    element:
      "Whether to automatically send airdrop requests based on the current endpoint",
    maxWidth: "14rem",
  },
  getValue: () => PgSettings.wallet.automaticAirdrop,
  setValue: (v) => (PgSettings.wallet.automaticAirdrop = v),
  onChange: PgSettings.onDidChangeWalletAutomaticAirdrop,
});
