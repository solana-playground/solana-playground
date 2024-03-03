import { createSetting } from "../create";

export const automaticAirdrop = createSetting({
  name: "Automatic airdrop",
  tooltip: {
    element:
      "Whether to automatically send an airdrop request based on the current endpoint",
    maxWidth: "18rem",
  },
  isCheckBox: true,
});
