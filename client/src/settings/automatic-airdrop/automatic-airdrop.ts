import { createSetting } from "../create";

export const automaticAirdrop = createSetting({
  id: "wallet.automaticAirdrop",
  name: "Automatic airdrop",
  tooltip: {
    element:
      "Whether to automatically send airdrop requests based on the current endpoint",
    maxWidth: "14rem",
  },
});
