import type { WasmAccount } from "@solana-playground/playnet";

import { PgCommon } from "../common";
import { PgWeb3 } from "../web3";

export class PgPlaynetUtils {
  /**
   * Convert WASM account to `web3.js.AccountInfo`
   *
   * @param wasmAccount the account object that wasm-bindgen created
   * @returns `web3.js` parsed account
   */
  static convertAccountInfo(
    wasmAccount: WasmAccount
  ): PgWeb3.AccountInfo<Buffer> {
    return {
      data: Buffer.from(wasmAccount.data),
      executable: wasmAccount.executable,
      lamports: PgCommon.bigintToInt(wasmAccount.lamports),
      owner: new PgWeb3.PublicKey(wasmAccount.owner.toBytes()),
      rentEpoch: PgCommon.bigintToInt(wasmAccount.rentEpoch),
    };
  }
}
