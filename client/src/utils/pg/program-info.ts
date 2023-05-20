import { Keypair, PublicKey } from "@solana/web3.js";
import { utils, Idl } from "@project-serum/anchor";
import {
  decodeIdlAccount,
  idlAddress,
} from "@project-serum/anchor/dist/cjs/idl";

import { declareUpdateable, updateable } from "./decorators";
import { PgCommon } from "./common";
import { PgConnection } from "./connection";
import { PgExplorer } from "./explorer";
import type { Nullable, PgDisposable } from "./types";

/** Program info state */
interface ProgramInfo
  extends Nullable<{
    /** Program's build server uuid */
    uuid: string;
    /** Program's keypair */
    kp: Keypair;
    /** Program's custom public key */
    customPk: PublicKey;
    /** Program's Anchor IDL */
    idl: Idl;
  }> {}

/** Serialized program info that's used in storage */
interface SerializedProgramInfo
  extends Nullable<{
    uuid: string;
    kp: Array<number>;
    customPk: string;
    idl: Idl;
  }> {}

const defaultState: ProgramInfo = {
  uuid: null,
  kp: null,
  customPk: null,
  idl: null,
};

const storage = {
  /** Relative path to program info */
  path: ".workspace/program-info.json",

  /** Read from storage and deserialize the data. */
  async read() {
    let serializedState: SerializedProgramInfo;
    try {
      const serializedStateStr = await PgExplorer.run({
        readToString: [this.path],
      });
      serializedState = JSON.parse(serializedStateStr);
    } catch {
      return defaultState;
    }

    return {
      ...serializedState,
      kp: serializedState.kp
        ? Keypair.fromSecretKey(Uint8Array.from(serializedState.kp))
        : null,
      customPk: serializedState.customPk
        ? new PublicKey(serializedState.customPk)
        : null,
    } as ProgramInfo;
  },

  /** Serialize the data and write to storage. */
  async write(state: ProgramInfo) {
    const explorer = await PgExplorer.get();
    if (!explorer.isShared) {
      const serializedState: SerializedProgramInfo = {
        ...state,
        kp: state.kp ? Array.from(state.kp.secretKey) : null,
        customPk: state.customPk?.toBase58() ?? null,
      };

      await explorer.newItem(this.path, JSON.stringify(serializedState), {
        override: true,
        openOptions: { dontOpen: true },
      });
    }
  },
};

@updateable({ defaultState, storage })
class _PgProgramInfo {
  /**
   * Get the program's public key.
   *
   * Custom public key has priority if it's specified.
   */
  static getPk() {
    if (PgProgramInfo.state.customPk) return PgProgramInfo.state.customPk;
    if (PgProgramInfo.state.kp) return PgProgramInfo.state.kp.publicKey;
    return null;
  }

  /** Get the current program's pubkey as base58 string. */
  static getPkStr() {
    return PgProgramInfo.getPk()?.toBase58() ?? null;
  }

  /** Get the JSON.stringified IDL from state. */
  static getIdlStr() {
    if (PgProgramInfo.state.idl) {
      return JSON.stringify(PgProgramInfo.state.idl);
    }

    return null;
  }

  /**
   * This method is implemented manually because `pk` is not being updated directly
   * and the value depends on other state values.
   *
   * @param cb callback function to run after program pubkey change
   * @returns a dispose function to clear the event
   */
  static onDidChangePk(cb: (pk: PublicKey | null) => any): PgDisposable {
    return PgCommon.batchChanges(
      () => cb(PgProgramInfo.getPk()),
      [PgProgramInfo.onDidChangeKp, PgProgramInfo.onDidChangeCustomPk]
    );
  }

  /**
   * Fetch the Anchor IDL from chain.
   *
   * NOTE: This is a reimplementation of `anchor.Program.fetchIdl` because that
   * function only returns the IDL without the IDL authority.
   *
   * @param programId optional program id
   * @returns the IDL and the authority of the IDL or `null` if IDL doesn't exist
   */
  static async getIdlFromChain(programId?: PublicKey | null) {
    if (!programId) {
      programId = PgProgramInfo.getPk();
      if (!programId) throw new Error("Program id not found.");
    }

    const idlPk = await idlAddress(programId);

    const conn = await PgConnection.get();
    const accountInfo = await conn.getAccountInfo(idlPk);
    if (!accountInfo) return null;

    // Chop off account discriminator
    const idlAccount = decodeIdlAccount(accountInfo.data.slice(8));
    const { inflate } = await import("pako");
    const inflatedIdl = inflate(idlAccount.data);
    const idl: Idl = JSON.parse(utils.bytes.utf8.decode(inflatedIdl));

    return { idl, authority: idlAccount.authority };
  }
}

export const PgProgramInfo = declareUpdateable(
  _PgProgramInfo,
  {} as ProgramInfo
);
