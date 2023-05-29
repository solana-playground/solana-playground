import { Keypair, PublicKey } from "@solana/web3.js";
import { utils, Idl } from "@project-serum/anchor";
import {
  decodeIdlAccount,
  idlAddress,
} from "@project-serum/anchor/dist/cjs/idl";

import {
  createDerivable,
  declareDerivable,
  declareUpdateable,
  derivable,
  updateable,
} from "./decorators";
import { PgCommand } from "./command";
import { PgConnection } from "./connection";
import { PgExplorer } from "./explorer";
import type { Nullable } from "./types";

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
      // Don't use spread operator(...) because of the extra derived state
      const serializedState: SerializedProgramInfo = {
        uuid: state.uuid,
        idl: state.idl,
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

const deriveState = () => ({
  /**
   * Get the program's public key.
   *
   * Custom public key has priority if it's specified.
   */
  pk: createDerivable({
    derive: (): PublicKey | null => {
      if (PgProgramInfo.customPk) return PgProgramInfo.customPk;
      if (PgProgramInfo.kp) return PgProgramInfo.kp.publicKey;
      return null;
    },
    onChange: ["kp", "customPk"],
  }),

  /** On-chain data of the program */
  onChain: createDerivable({
    derive: _PgProgramInfo.utils.fetch,
    // TODO: Add connection
    onChange: ["pk", PgCommand.connect.onDidRunFinish],
  }),
});

@derivable(deriveState)
@updateable({ defaultState, storage })
class _PgProgramInfo {
  /** Get the current program's pubkey as base58 string. */
  static getPkStr() {
    return PgProgramInfo.pk?.toBase58() ?? null;
  }

  /** Get the JSON.stringified IDL from state. */
  static getIdlStr() {
    if (PgProgramInfo.idl) return JSON.stringify(PgProgramInfo.idl);
    return null;
  }

  /** Program info related utilities */
  static utils = class {
    /**
     * Fetch the program from chain.
     *
     * @param programId optional program id
     * @returns program's authority and whether the program is upgradeable
     */
    static async fetch(programId?: PublicKey | null) {
      const conn = await PgConnection.get();
      if (!PgConnection.isReady(conn)) return;

      if (!programId && !PgProgramInfo.pk) return;
      programId = PgProgramInfo.pk as PublicKey;

      try {
        const programAccountInfo = await conn.getAccountInfo(programId);
        const programDataPkBuffer = programAccountInfo?.data.slice(4);
        if (!programDataPkBuffer) return { upgradeable: true };

        const programDataPk = new PublicKey(programDataPkBuffer);
        const programDataAccountInfo = await conn.getAccountInfo(programDataPk);

        // Check if program authority exists
        const authorityExists = programDataAccountInfo?.data.at(12);
        if (!authorityExists) return { upgradeable: false };

        const upgradeAuthorityPkBuffer = programDataAccountInfo?.data.slice(
          13,
          45
        );
        const upgradeAuthorityPk = new PublicKey(upgradeAuthorityPkBuffer!);
        return { authority: upgradeAuthorityPk, upgradeable: true };
      } catch (e: any) {
        console.log("Could not get authority:", e.message);
      }
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
    static async fetchIdl(programId?: PublicKey | null) {
      if (!programId) {
        programId = PgProgramInfo.pk;
        if (!programId) return null;
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
  };
}

export const PgProgramInfo = declareDerivable(
  declareUpdateable(_PgProgramInfo, {
    defaultState,
  }),
  deriveState
);
