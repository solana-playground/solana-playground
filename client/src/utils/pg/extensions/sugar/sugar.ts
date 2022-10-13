// @ts-nocheck

import { Emoji } from "../../../../constants";
import { PgTerminal } from "../../terminal";
import {
  processBundlr,
  processCollectionSet,
  processCreateConfig,
  processDeploy,
  processMint,
  processShow,
  processSign,
  processUpdate,
  processUpload,
  processVerify,
  processWithdraw,
} from "./commands";

/**
 * Metaplex Sugar CLI commands
 */
export class PgSugar {
  static async bundlr(...args) {
    await this._run(() => processBundlr(...args));
  }

  static async collectionSet(...args) {
    await this._run(() => processCollectionSet(...args));
  }

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

  static async mint(...args) {
    await this._run(() => processMint(...args));
  }

  static async reveal(rpcUrl: string | undefined) {}

  static async show(...args) {
    await this._run(() => processShow(...args));
  }

  static async sign(...args) {
    await this._run(() => processSign(...args));
  }

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

  static async update(...args) {
    await this._run(() => processUpdate(...args));
  }

  static async upload(...args) {
    await this._run(() => processUpload(...args));
  }

  static async validate(strict: boolean, skipCollectionPrompt: boolean) {}

  static async verify(...args) {
    await this._run(() => processVerify(...args));
  }

  static async withdraw(...args) {
    await this._run(() => processWithdraw(...args));
  }

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
    } finally {
      setTimeout(() => PgTerminal.setProgress(0), 1000);
    }
  }
}
