import { PgConnection } from "./connection";
import { createDerivable, declareDerivable, derivable } from "./decorators";
import { PgSettings } from "./settings";

/** Block explorer creation parameter */
interface BlockExplorerParam {
  /** Name of the block explorer */
  name: string;
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
  Required<BlockExplorerParam>,
  "getClusterParam" | "getCommonUrl"
>;

const derive = () => ({
  /** The current block explorer based on user's block explorer setting */
  current: createDerivable({
    derive: () => {
      return _PgBlockExplorer.all.find(
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
class _PgBlockExplorer {
  /** All block explorers */
  static all: BlockExplorer[];

  /**
   * Create a block explorer.
   *
   * @param b block explorer implementation
   * @returns the created block explorer
   */
  static create(b: BlockExplorerParam): BlockExplorer {
    b.getCommonUrl ??= (p, v) =>
      b.url + "/" + p + "/" + v + b.getClusterParam();
    b.getAddressUrl ??= (address) => b.getCommonUrl!("address", address);
    b.getTxUrl ??= (txHash) => b.getCommonUrl!("tx", txHash);

    return b as BlockExplorer;
  }
}

export const PgBlockExplorer = declareDerivable(_PgBlockExplorer, derive);
