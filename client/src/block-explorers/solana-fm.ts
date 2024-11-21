import { Endpoint } from "../constants";
import { PgBlockExplorer, PgConnection } from "../utils/pg";

export const solanaFM = PgBlockExplorer.create({
  name: "Solana FM",
  url: "https://solana.fm",
  getClusterParam: () => {
    switch (PgConnection.cluster) {
      case "mainnet-beta":
        return "";
      case "testnet":
        return "?cluster=testnet-solana";
      case "devnet":
        return "?cluster=devnet-solana";
      case "localnet":
        // Doesn't work with protocol ("http") prefix
        return "?cluster=custom-" + new URL(Endpoint.LOCALHOST).host;
    }
  },
});
