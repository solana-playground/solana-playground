export const PROJECT_NAME = "Solana Playground";
export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.solpg.io"
    : process.env.REACT_APP_SERVER_URL ?? "http://127.0.0.1:8080";
