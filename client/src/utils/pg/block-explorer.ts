import { Endpoint, EXPLORER_URL, SOLSCAN_URL } from "../../constants";

export class PgBlockExplorer {
  /**
   * Get the cluster URL parameter to add to the explorer URL(s)
   *
   * @returns the cluster URL suffix
   */
  static getClusterParam(endpoint: string) {
    // Mainnet by default
    let cluster = "";

    if (endpoint === Endpoint.LOCALHOST) {
      cluster = "?cluster=custom&customUrl=" + Endpoint.LOCALHOST;
    } else if (endpoint === Endpoint.DEVNET) {
      cluster = "?cluster=devnet";
    } else if (endpoint === Endpoint.TESTNET) {
      cluster = "?cluster=testnet";
    }

    return cluster;
  }

  /**
   * Get transaction urls for explorers
   *
   * @returns transaction url for solana explorer, solscan
   */
  static getTxUrl(txHash: string, endpoint: string) {
    let explorer = EXPLORER_URL + "/tx/" + txHash;
    const cluster = this.getClusterParam(endpoint);
    explorer += cluster;

    // Solscan doesn't have support for localhost
    if (endpoint === Endpoint.LOCALHOST) {
      return { explorer };
    }

    const solscan = SOLSCAN_URL + "/tx/" + txHash + cluster;

    return { explorer, solscan };
  }

  /**
   *  Get explorer urls for a mint
   *
   * @returns mint url for solana explorer, solscan
   */
  static getTokenUrl(mint: string, endpoint: string) {
    let explorer = EXPLORER_URL + "/address/" + mint;
    const cluster = this.getClusterParam(endpoint);
    explorer += cluster;

    // Solscan doesn't have support for localhost
    if (endpoint === Endpoint.LOCALHOST) {
      return { explorer };
    }

    const solscan = SOLSCAN_URL + "/token/" + mint + cluster;

    return { explorer, solscan };
  }
}
