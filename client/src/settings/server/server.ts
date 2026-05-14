import { GITHUB_URL } from "../../constants";
import { PgCommon } from "../../utils";
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
        ? process.env.REACT_APP_SAME_ORIGIN === "1"
          ? "." // relative URL — requests go to the same-origin BFF
          : process.env.REACT_APP_SERVER_URL ?? "https://api.solpg.io"
        : process.env.REACT_APP_SERVER_URL ?? "http://localhost:8080",
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
