import { createSetting } from "../create";

export const wallet = [
  createSetting({
    id: "wallet.automaticAirdrop",
    description:
      "Whether to automatically send airdrop requests when balance is less than the cluster's maximum airdrop amount",
    default: true,
  }),
];
