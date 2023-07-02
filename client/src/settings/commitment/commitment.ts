import CommitmentSetting from "./CommitmentSetting";
import type { Setting } from "../";

export const commitment: Setting = {
  name: "Commitment",
  Element: CommitmentSetting,
  tooltip: {
    text: "Commitment level to use when interacting with the endpoint",
    maxWidth: "12rem",
  },
};
