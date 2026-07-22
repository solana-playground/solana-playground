import { GITHUB_URL } from "../../constants";
import { PgCommon } from "../../utils";
import { createSetting } from "../create";

const SOLANA_FOUNDATION_SERVER_URL =
  process.env.REACT_APP_FOUNDATION_SERVER_URL ??
  "https://api.playground.solana.com";
// TODO: swap to the line below once the foundation domain is bound.
// const SOLANA_FOUNDATION_SERVER_URL = "https://api.playground.solana.com";

export const server = [
  createSetting({
    id: "server.endpoint",
    description: "Build server URL",
    values: [
      { name: "Local", value: "http://localhost:8080" },
      { name: "Solana Foundation", value: SOLANA_FOUNDATION_SERVER_URL },
      { name: "SolPg", value: "https://api.solpg.io" },
    ],
    default:
      process.env.NODE_ENV === "production"
        ? SOLANA_FOUNDATION_SERVER_URL
        : // Docker builds use this environment variable to set the server URL
          // to the production API (instead of local) if the user has not yet
          // built the server image
          process.env.REACT_APP_SERVER_URL ?? "http://localhost:8080",
    custom: {
      parse: (v) => {
        if (PgCommon.isUrl(v)) return v;
        throw new Error(`The setting value must be a URL: ${v}`);
      },
      type: "URL",
      placeholder: "https://...",
      tip: `Make sure the endpoint runs [the playground server](${GITHUB_URL}/tree/master/server).`,
    },
  }),
];
