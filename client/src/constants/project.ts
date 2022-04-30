export const PROJECT_NAME = "Solana Playground";
const ENDPOINT = "https://api.solpg.io";
export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? ENDPOINT
    : process.env.REACT_APP_SERVER_URL ?? ENDPOINT;
export const CLIENT_URL = "beta.solpg.io";
export const GITHUB_URL =
  "https://github.com/solana-playground/solana-playground";
