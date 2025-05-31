import { createSetting } from "../create";

export const commitment = createSetting({
  id: "connection.commitment",
  name: "Commitment",
  description: "Commitment level to use when interacting with the endpoint",
  values: ["processed", "confirmed", "finalized"] as const,
});
