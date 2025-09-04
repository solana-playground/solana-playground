import { Endpoint, NETWORKS } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { createSetting } from "../create";

export const connection = [
  createSetting({
    id: "connection.commitment",
    description: "Commitment level to use when interacting with the endpoint",
    values: ["processed", "confirmed", "finalized"] as const,
    default: "confirmed" as const,
  }),
  createSetting({
    id: "connection.endpoint",
    description:
      "RPC URL that lets you interact with a specific Solana cluster",
    values: NETWORKS.map((n) => ({ name: n.name, value: n.endpoint })),
    default: Endpoint.DEVNET,
    custom: {
      parse: (v) => {
        if (PgCommon.isUrl(v)) return v;
        throw new Error(`The setting value must be a URL: ${v}`);
      },
      type: "URL",
      placeholder: "https://...",
      tip: "Check out the list of [RPC providers](https://solana.com/rpc) if you don't have a custom endpoint.",
    },
  }),
  createSetting({
    id: "connection.preflightChecks",
    description:
      "If enabled, this check will simulate transactions before sending them and only the transactions that pass the simulation will be sent",
    default: true,
  }),
  createSetting({
    id: "connection.priorityFee",
    description:
      "Priority fee calculation method to use when sending transactions",
    values: ["average", "median", "min", "max"] as const,
    default: "median" as const,
    custom: {
      parse: (v) => {
        if (PgCommon.isInt(v)) return parseInt(v);
        throw new Error(`The setting value must be an integer: ${v}`);
      },
      type: "micro lamports",
      placeholder: "9000",
      tip: "Check out the priority fees [guide](https://solana.com/developers/guides/advanced/how-to-use-priority-fees) for more information.",
    },
  }),
];
