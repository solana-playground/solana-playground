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
}

type BlockExplorer = Omit<
  Required<BlockExplorerImpl>,
  "getClusterParam" | "getCommonUrl"
>;

const createBlockExplorer = (b: BlockExplorerImpl) => {
  b.getCommonUrl ??= (p, v) => b.url + "/" + p + "/" + v + b.getClusterParam();
  b.getAddressUrl ??= (address) => b.getCommonUrl!("address", address);
  b.getTxUrl ??= (txHash) => b.getCommonUrl!("tx", txHash);

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
  getClusterParam: () => {
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

const derive = () => ({
  /** The current block explorer based on user's block explorer setting */
  current: createDerivable({
    derive: () => {
      return (
        _PgBlockExplorer.ALL.find(
          (be) => be.name === PgSettings.other.blockExplorer
        ) ?? SOLANA_EXPLORER
      );
    },
    onChange: [
      PgSettings.onDidChangeOtherBlockExplorer,
      PgConnection.onDidChangeCluster,
    ],
  }),
});

@derivable(derive)
class _PgBlockExplorer {
  /** All block explorers */
  static readonly ALL = [SOLANA_EXPLORER, SOLSCAN, SOLANA_FM];
}

export const PgBlockExplorer = declareDerivable(_PgBlockExplorer, derive);
