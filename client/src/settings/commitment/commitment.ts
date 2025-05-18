import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const commitment = createSetting({
  name: "Commitment",
  tooltip: {
    element: "Commitment level to use when interacting with the endpoint",
    maxWidth: "12rem",
  },
  values: ["processed", "confirmed", "finalized"] as const,
  getValue: () => PgSettings.connection.commitment,
  setValue: (v) => (PgSettings.connection.commitment = v),
  onChange: PgSettings.onDidChangeConnectionCommitment,
});
