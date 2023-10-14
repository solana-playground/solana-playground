import { createSetting } from "../create";

export const commitment = createSetting({
  name: "Commitment",
  tooltip: {
    element: "Commitment level to use when interacting with the endpoint",
    maxWidth: "12rem",
  },
});
