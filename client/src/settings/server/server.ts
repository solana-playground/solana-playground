import { GITHUB_URL } from "../../constants";
import { PgCommon } from "../../utils/pg";
import { createSetting } from "../create";

export const server = [
  createSetting({
    id: "server.endpoint",
    description: "Build server URL",
    values: [
      { name: "Local", value: "http://localhost:8080" },
      { name: "Solana Playground", value: "https://api.solpg.io" },
    ],
    default:
      process.env.NODE_ENV === "production"
        ? "https://api.solpg.io"
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
