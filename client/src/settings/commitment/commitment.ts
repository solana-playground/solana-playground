import CommitmentSetting from "./CommitmentSetting";
import { createSetting } from "../create";

export const commitment = createSetting({
  name: "Commitment",
  Component: CommitmentSetting,
  tooltip: {
    text: "Commitment level to use when interacting with the endpoint",
    maxWidth: "12rem",
  },
});
