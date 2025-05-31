import { Endpoint } from "../constants";
import { PgBlockExplorer, PgConnection } from "../utils/pg";

export const solanaExplorer = PgBlockExplorer.create({
  name: "Solana Explorer",
  url: "https://explorer.solana.com",
  getClusterParam: () => {
    switch (PgConnection.cluster) {
      case "testnet":
        return "?cluster=testnet";
      case "devnet":
        return "?cluster=devnet";
      case "localnet":
        return "?cluster=custom&customUrl=" + Endpoint.LOCALNET;
      default:
        return "";
    }
  },
});
