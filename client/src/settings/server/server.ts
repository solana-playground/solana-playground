import { GITHUB_URL } from "../../constants";
import { PgCommon } from "../../utils";
import { createSetting } from "../create";

const customServerUrl = process.env.REACT_APP_SERVER_URL;

export const server = [
  createSetting({
    id: "server.endpoint",
    description: "Build server URL",
    values: [
      ...(customServerUrl
        ? [{ name: "Solana Playground", value: customServerUrl }]
        : []),
      { name: "Solpg Playground API", value: "https://api.solpg.io" },
      { name: "Local", value: "http://localhost:8080" },
    ],
    default:
      customServerUrl ??
      (process.env.NODE_ENV === "production"
        ? "https://api.solpg.io"
        : "http://localhost:8080"),
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
