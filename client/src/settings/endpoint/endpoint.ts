import EndpointSetting from "./EndpointSetting";
import { createSetting } from "../create";

export const endpoint = createSetting({
  name: "Endpoint",
  Component: EndpointSetting,
  tooltip: {
    text: "RPC URL that lets you interact with a specific Solana cluster",
    maxWidth: "10rem",
  },
});
