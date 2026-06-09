import { GITHUB_URL } from "../../constants";
import { PgCommon } from "../../utils";
import { createSetting } from "../create";

const solanaFoundationServerUrl =
  process.env.REACT_APP_SOLANA_FOUNDATION_SERVER_URL;

export const server = [
  createSetting({
    id: "server.endpoint",
    description: "Build server URL",
    values: [
      { name: "Local", value: "http://localhost:8080" },
      ...(solanaFoundationServerUrl
        ? [{ name: "Solana Foundation", value: solanaFoundationServerUrl }]
        : []),
      { name: "SolPg", value: "https://api.solpg.io" },
    ],
    default:
      process.env.NODE_ENV === "production"
        ? solanaFoundationServerUrl ?? "https://api.solpg.io"
        : "http://localhost:8080",
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
