import { decodeIdlAccount, idlAddress } from "@coral-xyz/anchor/dist/cjs/idl";
import type { Idl } from "@coral-xyz/anchor";

import { PgBytes } from "./bytes";
import { PgCommand } from "./command";
import { PgConnection } from "./connection";
import {
  createDerivable,
  declareDerivable,
  declareUpdatable,
  derivable,
  migratable,
  updatable,
} from "./decorators";
import { PgExplorer } from "./explorer";
import { PgWeb3 } from "./web3";
import type { Nullable } from "./types";

/** Program info state */
type ProgramInfo = Nullable<{
  /** Program's build server uuid */
  uuid: string;
  /** Program's keypair */
  kp: PgWeb3.Keypair;
  /** Program's custom public key */
  customPk: PgWeb3.PublicKey;
  /** Program's Anchor IDL */
  idl: Idl;
  /** Imported program binary file */
  importedProgram: {
    buffer: Buffer;
    fileName: string;
  };
}>;

/** Serialized program info that's used in storage */
type SerializedProgramInfo = Nullable<{
  uuid: string;
  kp: Array<number>;
  customPk: string;
  idl: Idl;
}>;

const defaultState: ProgramInfo = {
  uuid: null,
  kp: null,
  customPk: null,
  idl: null,
  importedProgram: null,
};

const storage = {
  /** Relative path to program info */
  PATH: ".workspace/program-info.json",

  /** Read from storage and deserialize the data. */
  async read(): Promise<ProgramInfo> {
    if (!PgExplorer.currentWorkspaceName) return defaultState;

    let serializedState: SerializedProgramInfo;
    try {
      serializedState = await PgExplorer.fs.readToJSON(this.PATH);
    } catch {
      return defaultState;
    }

    return {
      ...serializedState,
      kp: serializedState.kp
        ? PgWeb3.Keypair.fromSecretKey(Uint8Array.from(serializedState.kp))
        : null,
      customPk: serializedState.customPk
        ? new PgWeb3.PublicKey(serializedState.customPk)
        : null,
      importedProgram: defaultState.importedProgram,
    };
  },

  /** Serialize the data and write to storage. */
  async write(state: ProgramInfo) {
    if (!PgExplorer.currentWorkspaceName) return;

    // Don't use spread operator(...) because of the extra derived state
    const serializedState: SerializedProgramInfo = {
      uuid: state.uuid,
      idl: state.idl,
      kp: state.kp ? Array.from(state.kp.secretKey) : null,
      customPk: state.customPk?.toBase58() ?? null,
    };

    await PgExplorer.fs.writeFile(this.PATH, JSON.stringify(serializedState));
  },
};

const derive = () => ({
  /**
   * Get the program's public key.
   *
   * Custom public key has priority if it's specified.
   */
  pk: createDerivable({
    derive: (): PgWeb3.PublicKey | null => {
      if (PgProgramInfo.customPk) return PgProgramInfo.customPk;
      if (PgProgramInfo.kp) return PgProgramInfo.kp.publicKey;
      return null;
    },
    onChange: ["kp", "customPk"],
  }),

  /** On-chain data of the program */
  onChain: createDerivable({
    derive: async () => {
      try {
        return await _PgProgramInfo.fetch();
      } catch {}
    },
    onChange: ["pk", PgConnection.onDidChange, PgCommand.deploy.onDidRunFinish],
  }),
});

// TODO: Remove in 2024
const migrate = () => {
  // Removing the `program-info` key is enough for migration because the data
  // is already stored in `indexedDB`
  localStorage.removeItem("programInfo");
};

@migratable(migrate)
@derivable(derive)
@updatable({ defaultState, storage })
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

  /**
   * Fetch the program from chain.
   *
   * @param programId optional program id
   * @returns program's authority and whether the program is upgradable
   */
  static async fetch(programId: PgWeb3.PublicKey | null = PgProgramInfo.pk) {
    if (!programId) throw new Error("Program id doesn't exist");

    const conn = PgConnection.current;
    if (!PgConnection.isReady(conn)) throw new Error("Connection is not ready");

    const programAccountInfo = await conn.getAccountInfo(programId);
    const deployed = !!programAccountInfo;
    if (!programAccountInfo) return { deployed, upgradable: true };

    const programDataPkBuffer = programAccountInfo.data.slice(4);
    const programDataPk = new PgWeb3.PublicKey(programDataPkBuffer);
    const programDataAccountInfo = await conn.getAccountInfo(programDataPk);

    // Check if program authority exists
    const authorityExists = programDataAccountInfo?.data.at(12);
    if (!authorityExists) return { deployed, upgradable: false };

    const upgradeAuthorityPkBuffer = programDataAccountInfo?.data.slice(13, 45);
    const upgradeAuthorityPk = new PgWeb3.PublicKey(upgradeAuthorityPkBuffer!);
    return { deployed, authority: upgradeAuthorityPk, upgradable: true };
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
  static async fetchIdl(programId = PgProgramInfo.pk) {
    if (!programId) throw new Error("Program id doesn't exist");

    const idlPk = await idlAddress(programId);
    const accountInfo = await PgConnection.current.getAccountInfo(idlPk);
    if (!accountInfo) return null;

    // Chop off account discriminator
    const idlAccount = decodeIdlAccount(accountInfo.data.slice(8));
    const { inflate } = await import("pako");
    const inflatedIdl = inflate(idlAccount.data);
    const idl: Idl = JSON.parse(PgBytes.toUtf8(Buffer.from(inflatedIdl)));

    return { idl, authority: idlAccount.authority };
  }
}

export const PgProgramInfo = declareDerivable(
  declareUpdatable(_PgProgramInfo, { defaultState }),
  derive
);
