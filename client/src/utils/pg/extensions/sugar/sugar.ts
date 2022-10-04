import { PgTerminal } from "../../terminal";

enum BundlrAction {
  Balance = 0,
  Withraw = 1,
}

/**
 * Metaplex Sugar CLI commands
 */
export class PgSugar {
  static async bundlr(rpcUrl: string | undefined, action: BundlrAction) {}

  static async collectionSet(
    rpcUrl: string | undefined,
    candyMachine: string | undefined,
    collectionMint: string
  ) {}

  static async collectionRemove(
    rpcUrl: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async createConfig(rpcUrl: string | undefined) {}

  static async deploy(rpcUrl: string | undefined) {}

  static async freezeDisable(
    rpcUrl: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async freezeEnable(
    rpcUrl: string | undefined,
    candyMachine: string | undefined,
    freezeDays: number | undefined
  ) {}

  static async hash(compare: string | undefined) {}

  static async launch(
    rpcUrl: string | undefined,
    strict: boolean,
    skipCollectionPrompt: boolean
  ) {}

  static async mint(
    rpcUrl: string | undefined,
    number: number | undefined,
    receiver: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async reveal(rpcUrl: string | undefined) {}

  static async show(
    rpcUrl: string | undefined,
    candyMachine: string | undefined,
    unminted: boolean
  ) {}

  static async sign(
    rpcUrl: string | undefined,
    mint: string | undefined,
    candyMachineId: string | undefined
  ) {}

  static async thaw(
    rpcUrl: string | undefined,
    all: boolean,
    candyMachine: string | undefined,
    nftMint: string | undefined
  ) {}

  static async unfreezeFunds(
    rpcUrl: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async update(
    rpcUrl: string | undefined,
    newAuthority: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async upload(rpcUrl: string | undefined) {}

  static async validate(strict: boolean, skipCollectionPrompt: boolean) {}

  static async verify(rpcUrl: string | undefined) {}

  static async withdraw(
    candyMachine: string | undefined,
    rpcUrl: string | undefined,
    list: boolean
  ) {}

  /**
   * WASM panics if any of the `PgSugar` processes throw an error.
   * We are catching the errors and log it similar to Sugar's the Rust implementation.
   *
   * @param cb callback function to run
   */
  private static async _run(cb: () => Promise<void>) {
    try {
      await cb();
    } catch (e: any) {
      PgTerminal.logWasm(
        `${PgTerminal.CROSS} ${PgTerminal.error(
          "Error running command (re-run needed):"
        )} ${e.message}\n`
      );
    }
  }
}
