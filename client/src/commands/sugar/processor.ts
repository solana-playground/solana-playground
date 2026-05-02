import { Emoji, Endpoint } from "../../constants";
import { PgCommon, PgConnection, PgTerminal, PgView } from "../../utils";
import {
  processBundlr,
  processCollectionSet,
  processCreateConfig,
  processDeploy,
  processGuardAdd,
  processGuardRemove,
  processGuardShow,
  processGuardUpdate,
  processGuardWithdraw,
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
  static PATHS = {
    METAPLEX_DIRNAME: "metaplex",
    get CANDY_MACHINE_DIR_PATH() {
      return PgCommon.joinPaths(this.METAPLEX_DIRNAME, "candy-machine");
    },
    get CANDY_MACHINE_CONFIG_FILEPATH() {
      return PgCommon.joinPaths(this.CANDY_MACHINE_DIR_PATH, "config.json");
    },
    get CANDY_MACHINE_CACHE_FILEPATH() {
      return PgCommon.joinPaths(this.CANDY_MACHINE_DIR_PATH, "cache.json");
    },
    get CANDY_MACHINE_ASSETS_DIR_PATH() {
      return PgCommon.joinPaths(this.CANDY_MACHINE_DIR_PATH, "assets");
    },
  };

  static async bundlr(...args: Parameters<typeof processBundlr>) {
    await this._run(() => processBundlr(...args));
  }

  static async collectionSet(...args: Parameters<typeof processCollectionSet>) {
    await this._run(() => processCollectionSet(...args));
  }

  static async createConfig(...args: Parameters<typeof processCreateConfig>) {
    await this._run(() => processCreateConfig(...args));
  }

  static async deploy(...args: Parameters<typeof processDeploy>) {
    await this._run(() => processDeploy(...args));
  }

  static async guardAdd(...args: Parameters<typeof processGuardAdd>) {
    await this._run(() => processGuardAdd(...args));
  }

  static async guardRemove(...args: Parameters<typeof processGuardRemove>) {
    await this._run(() => processGuardRemove(...args));
  }

  static async guardShow(...args: Parameters<typeof processGuardShow>) {
    await this._run(() => processGuardShow(...args));
  }

  static async guardUpdate(...args: Parameters<typeof processGuardUpdate>) {
    await this._run(() => processGuardUpdate(...args));
  }

  static async guardWithdraw(...args: Parameters<typeof processGuardWithdraw>) {
    await this._run(() => processGuardWithdraw(...args));
  }

  static async hash(...args: Parameters<typeof processHash>) {
    await this._run(() => processHash(...args));
  }

  static async launch(...args: Parameters<typeof processLaunch>) {
    await this._run(() => processLaunch(...args));
  }

  static async mint(...args: Parameters<typeof processMint>) {
    await this._run(() => processMint(...args));
  }

  static async reveal(...args: Parameters<typeof processReveal>) {
    await this._run(() => processReveal(...args));
  }

  static async show(...args: Parameters<typeof processShow>) {
    await this._run(() => processShow(...args));
  }

  static async sign(...args: Parameters<typeof processSign>) {
    await this._run(() => processSign(...args));
  }

  static async update(...args: Parameters<typeof processUpdate>) {
    await this._run(() => processUpdate(...args));
  }

  static async upload(...args: Parameters<typeof processUpload>) {
    await this._run(() => processUpload(...args));
  }

  static async validate(...args: Parameters<typeof processValidate>) {
    await this._run(() => processValidate(...args));
  }

  static async verify(...args: Parameters<typeof processVerify>) {
    await this._run(() => processVerify(...args));
  }

  static async withdraw(...args: Parameters<typeof processWithdraw>) {
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
      PgTerminal.println(
        `\n${Emoji.CHECKMARK} ${PgTerminal.success("Command successful.")}\n`
      );
    } catch (e: any) {
      PgTerminal.println(
        `\n${Emoji.ERROR} ${PgTerminal.error(
          "Error running command (re-run needed):"
        )} ${e.message}`,

        { noColor: true }
      );
      // Show how to set a custom rpc endpoint if the current endpoint is a known endpoint
      if (
        [Endpoint.DEVNET, Endpoint.TESTNET, Endpoint.MAINNET_BETA].some(
          (e) => e === PgConnection.current.rpcEndpoint
        )
      ) {
        PgTerminal.println(
          `${
            e.message?.endsWith("\n") ? "" : "\n"
          }NOTE: You may want to use a custom rpc endpoint. If you have one, you can set it up with ${PgTerminal.bold(
            "'solana config set --url <RPC_URL>'"
          )}`
        );
      }
    } finally {
      setTimeout(() => PgView.setMainSecondaryProgress(0), 1000);
    }
  }
}
