import { Endpoint } from "../../constants";
import { PgConnection } from "./connection";
import { createDerivable, declareDerivable, derivable } from "./decorators";
import { PgSettings } from "./settings";

interface BlockExplorerImpl {
  /** Name of the block explorer */
  name: typeof PgSettings["other"]["blockExplorer"];
  /** Base URL of the explorer website */
  url: string;
  /**
   * Get the cluster URL parameter to add to the explorer URLs.
   *
   * @returns the cluster URL parameter
   */
  getClusterParam(): string;
  /**
   * Get the common URL i.e. a URL that follows simple enough `path` and
   * `value` in order to be able to derive the full URLs.
   *
   * @param path URL path
   * @param value last path value
   */
  getCommonUrl?(path: string, value: string): string;
  /**
   * Get address URL for the configured explorer.
   *
   * @param address public key
   * @returns the address URL
   */
  getAddressUrl?(address: string): string;
  /**
   * Get transaction URL for the configured explorer.
   *
   * @param txHash transaction signature
   * @returns the transaction URL
   */
  getTxUrl?(txHash: string): string;
  /**
   *  Get mint URL for the configured explorer.
   *
   * @param mint mint (token) public key
   * @returns the mint URL
   */
  getTokenUrl?(mint: string): string;
}

type BlockExplorer = Omit<
  Required<BlockExplorerImpl>,
  "getClusterParam" | "getCommonUrl"
>;

const createBlockExplorer = (b: BlockExplorerImpl) => {
  b.getCommonUrl ??= (p, v) => b.url + "/" + p + "/" + v + b.getClusterParam();
  b.getAddressUrl ??= (address) => b.getCommonUrl!("address", address);
  b.getTxUrl ??= (txHash) => b.getCommonUrl!("tx", txHash);
  b.getTokenUrl ??= (mint) => b.getCommonUrl!("address", mint);

  return b as BlockExplorer;
};

const SOLANA_EXPLORER = createBlockExplorer({
  name: "Solana Explorer",
  url: "https://explorer.solana.com",
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
});

const SOLSCAN = createBlockExplorer({
  name: "Solscan",
  url: "https://solscan.io",
  getTokenUrl(mint) {
    return this.getCommonUrl!("token", mint);
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
});

const SOLANA_FM = createBlockExplorer({
  name: "Solana FM",
  url: "https://solana.fm",
  getClusterParam() {
    // Solana FM doesn't switch networks from the URL
    return "";
  },
});

const EXPLORERS = [SOLANA_EXPLORER, SOLSCAN, SOLANA_FM];

const derive = () => ({
  /** The current block explorer based on user's block explorer setting */
  current: createDerivable({
    derive: () => {
      return EXPLORERS.find(
        (be) => be.name === PgSettings.other.blockExplorer
      )!;
    },
    onChange: [
      PgSettings.onDidChangeOtherBlockExplorer,
      PgConnection.onDidChangeCluster,
    ],
  }),
});

@derivable(derive)
class _PgBlockExplorer {}

export const PgBlockExplorer = declareDerivable(_PgBlockExplorer, derive);
