import EndpointSetting from "./EndpointSetting";
import type { Setting } from "../";

export const endpoint: Setting = {
  name: "Endpoint",
  Element: EndpointSetting,
  tooltip: {
    text: "RPC URL that lets you interact with a specific Solana cluster",
    maxWidth: "10rem",
  },
};
