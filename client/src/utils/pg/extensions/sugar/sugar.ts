// @ts-nocheck

import { Emoji } from "../../../../constants";
import { PgTerminal } from "../../terminal";
import {
  processBundlr,
  processCreateConfig,
  processDeploy,
  processUpload,
} from "./commands";

/**
 * Metaplex Sugar CLI commands
 */
export class PgSugar {
  static async bundlr(...args) {
    await this._run(() => processBundlr(...args));
  }

  static async collectionSet(
    rpcUrl: string | undefined,
    candyMachine: string | undefined,
    collectionMint: string
  ) {}

  static async collectionRemove(
    rpcUrl: string | undefined,
    candyMachine: string | undefined
  ) {}

  static async createConfig(...args) {
    await this._run(() => processCreateConfig(...args));
  }

  static async deploy(...args) {
    await this._run(() => processDeploy(...args));
  }

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

  static async upload(...args) {
    await this._run(() => processUpload(...args));
  }

  static async validate(strict: boolean, skipCollectionPrompt: boolean) {}

  static async verify(rpcUrl: string | undefined) {}

  static async withdraw(
    candyMachine: string | undefined,
    rpcUrl: string | undefined,
    list: boolean
  ) {}

  /**
   * WASM panics if any of the `PgSugar` processes throw an error.
   * We are catching the errors and log them similar to Sugar's Rust implementation.
   *
   * @param cb callback function to run
   */
  private static async _run(cb: () => Promise<void>) {
    try {
      await cb();
      PgTerminal.log(
        `\n${Emoji.CHECKMARK} ${PgTerminal.success("Command successful.")}\n`
      );
    } catch (e: any) {
      PgTerminal.log(
        `\n${Emoji.ERROR} ${PgTerminal.error(
          "Error running command (re-run needed):"
        )} ${e.message}`,
        { noColor: true }
      );
    }
  }
}
