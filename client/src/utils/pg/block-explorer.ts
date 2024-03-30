import { Endpoint } from "../../constants";
import { PgConnection } from "./connection";
import { PgSettings } from "./settings";

interface BlockExplorerImpl {
  /** Name of the block explorer */
  name: typeof PgSettings["other"]["blockExplorer"];
  /** Base URL of the explorer website */
  url: string;
  /**
   * Get address URL for the configured explorer.
   *
   * @param address public key
   * @returns the address URL
   */
  getAddressUrl(address: string): string;
  /**
   * Get transaction URL for the configured explorer.
   *
   * @param txHash transaction signature
   * @returns the transaction URL
   */
  getTxUrl(txHash: string): string;
  /**
   *  Get mint URL for the configured explorer.
   *
   * @param mint mint (token) public key
   * @returns the mint URL
   */
  getTokenUrl(mint: string): string;
  /**
   * Get the common URL i.e. a URL that follows simple enough `path` and
   * `value` in order to be able to derive the full URLs.
   *
   * @param path URL path
   * @param value last path value
   */
  getCommonUrl(path: string, value: string): string;
  /**
   * Get the cluster URL parameter to add to the explorer URLs.
   *
   * @returns the cluster URL parameter
   */
  getClusterParam(): string;
}

type BlockExplorer = Omit<
  BlockExplorerImpl,
  "getClusterParam" | "getCommonUrl"
>;

const SOLANA_EXPLORER: BlockExplorerImpl = {
  name: "Solana Explorer",
  url: "https://explorer.solana.com",
  getAddressUrl(address) {
    return this.getCommonUrl("address", address);
  },
  getTxUrl(txHash) {
    return this.getCommonUrl("tx", txHash);
  },
  getTokenUrl(mint) {
    return this.getCommonUrl("address", mint);
  },
  getCommonUrl(path, value) {
    return this.url + "/" + path + "/" + value + this.getClusterParam();
  },
  getClusterParam: () => {
    switch (PgConnection.cluster) {
      case "mainnet-beta":
        return "";
      case "testnet":
        return "?cluster=testnet";
      case "devnet":
        return "?cluster=devnet";
      case "localnet":
        return "?cluster=custom&customUrl=" + Endpoint.LOCALHOST;
    }
  },
};

const SOLSCAN: BlockExplorerImpl = {
  name: "Solscan",
  url: "https://solscan.io",
  getAddressUrl(address) {
    return this.getCommonUrl("address", address);
  },
  getTxUrl(txHash) {
    return this.getCommonUrl("tx", txHash);
  },
  getTokenUrl(mint) {
    return this.getCommonUrl("token", mint);
  },
  getCommonUrl(path, value) {
    return this.url + "/" + path + "/" + value + this.getClusterParam();
  },
  getClusterParam() {
    switch (PgConnection.cluster) {
      case "mainnet-beta":
        return "";
      case "testnet":
        return "?cluster=testnet";
      case "devnet":
        return "?cluster=devnet";
      case "localnet":
        // No support https://solana.stackexchange.com/a/2330
        return "";
    }
  },
};

const EXPLORERS = [SOLANA_EXPLORER, SOLSCAN];

export class PgBlockExplorer {
  /** Get the current block explorer based on user's block explorer setting. */
  static get() {
    return EXPLORERS.find(
      (be) => be.name === PgSettings.other.blockExplorer
    ) as BlockExplorer;
  }
}
