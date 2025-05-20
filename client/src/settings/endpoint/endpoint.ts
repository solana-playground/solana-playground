import { NETWORKS } from "../../constants";
import { createSetting } from "../create";

export const endpoint = createSetting({
  id: "connection.endpoint",
  name: "Endpoint",
  tooltip: {
    element: "RPC URL that lets you interact with a specific Solana cluster",
    maxWidth: "10rem",
  },
  values: NETWORKS.map((n) => ({ name: n.name, value: n.endpoint })),
});
