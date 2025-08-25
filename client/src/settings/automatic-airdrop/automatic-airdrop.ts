import { createSetting } from "../create";

export const automaticAirdrop = createSetting({
  id: "wallet.automaticAirdrop",
  description:
    "Whether to automatically send airdrop requests based on the current endpoint",
});
