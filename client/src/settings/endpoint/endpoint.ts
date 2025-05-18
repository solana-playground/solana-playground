import { NETWORKS } from "../../constants";
import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const endpoint = createSetting({
  name: "Endpoint",
  tooltip: {
    element: "RPC URL that lets you interact with a specific Solana cluster",
    maxWidth: "10rem",
  },
  values: NETWORKS.map((n) => ({ name: n.name, value: n.endpoint })),
  getValue: () => PgSettings.connection.endpoint,
  setValue: (v) => (PgSettings.connection.endpoint = v),
  onChange: PgSettings.onDidChangeConnectionEndpoint,
});
