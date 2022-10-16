// @ts-nocheck

import { Emoji } from "../../../../constants";
import { PgTerminal } from "../../terminal";
import {
  processBundlr,
  processCollectionSet,
  processCreateConfig,
  processDeploy,
  processGuardAdd,
  processGuardRemove,
  processGuardShow,
  processHash,
  processLaunch,
  processMint,
  processReveal,
  processShow,
  processSign,
  processUpdate,
  processUpload,
  processValidate,
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

  static async createConfig(...args) {
    await this._run(() => processCreateConfig(...args));
  }

  static async deploy(...args) {
    await this._run(() => processDeploy(...args));
  }

  static async guardAdd(...args) {
    await this._run(() => processGuardAdd(...args));
  }

  static async guardRemove(...args) {
    await this._run(() => processGuardRemove(...args));
  }

  static async guardShow(...args) {
    await this._run(() => processGuardShow(...args));
  }

  static async guardUpdate(
    rpcUrl: string | undefined,
    candyGuard: string | undefined
  ) {}

  static async guardWithdraw(
    rpcUrl: string | undefined,
    candyGuard: string | undefined
  ) {}

  static async hash(...args) {
    await this._run(() => processHash(...args));
  }

  static async launch(...args) {
    await this._run(() => processLaunch(...args));
  }

  static async mint(...args) {
    await this._run(() => processMint(...args));
  }

  static async reveal(...args) {
    await this._run(() => processReveal(...args));
  }

  static async show(...args) {
    await this._run(() => processShow(...args));
  }

  static async sign(...args) {
    await this._run(() => processSign(...args));
  }

  static async update(...args) {
    await this._run(() => processUpdate(...args));
  }

  static async upload(...args) {
    await this._run(() => processUpload(...args));
  }

  static async validate(...args) {
    await this._run(() => processValidate(...args));
  }

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
