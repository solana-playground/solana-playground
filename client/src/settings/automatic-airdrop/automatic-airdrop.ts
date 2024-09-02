import { createSetting } from "../create";

export const automaticAirdrop = createSetting({
  name: "Automatic airdrop",
  tooltip: {
    element:
      "Whether to automatically send airdrop requests based on the current endpoint",
    maxWidth: "14rem",
  },
  isCheckBox: true,
});
