import { createSetting } from "../create";

export const endpoint = createSetting({
  name: "Endpoint",
  tooltip: {
    element: "RPC URL that lets you interact with a specific Solana cluster",
    maxWidth: "10rem",
  },
});
