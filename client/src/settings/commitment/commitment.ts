import { createSetting } from "../create";

export const commitment = createSetting({
  id: "connection.commitment",
  name: "Commitment",
  tooltip: {
    element: "Commitment level to use when interacting with the endpoint",
    maxWidth: "12rem",
  },
  values: ["processed", "confirmed", "finalized"] as const,
});
