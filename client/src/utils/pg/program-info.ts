import { Idl, utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  decodeIdlAccount,
  idlAddress,
} from "@project-serum/anchor/dist/cjs/idl";

import { PgConnection } from "./connection";

export interface ProgramInfo {
  uuid?: string;
  idl?: Idl | null;
  kp?: Array<number> | null;
  customPk?: string | null;
}

export class PgProgramInfo {
  /**
   * @returns the JSON.stringified IDL from localStorage
   */
  static get idlStr() {
    const idl = this.getProgramInfo().idl;
    if (!idl) return null;

    return JSON.stringify(idl);
  }

  /**
   * @returns the current program's pubkey as base58 string
   */
  static get pkStr() {
    const result = this.getPk();
    if (!result.programPk) return null;

    return result.programPk.toBase58();
  }

  /**
   * @returns program info if it exists in localStorage
   */
  static getProgramInfo() {
    const programInfo: ProgramInfo = JSON.parse(
      localStorage.getItem(this._PROGRAM_INFO_KEY) || "{}"
    );
    return programInfo;
  }

  /**
   * Update localStorage program info
   */
  static update(params: ProgramInfo) {
    const programInfo: ProgramInfo = this.getProgramInfo();

    if (params.kp) programInfo.kp = params.kp;
    if (params.uuid) programInfo.uuid = params.uuid;
    if (params.idl !== undefined) programInfo.idl = params.idl;
    if (params.customPk !== undefined) programInfo.customPk = params.customPk;

    localStorage.setItem(this._PROGRAM_INFO_KEY, JSON.stringify(programInfo));
  }

  /**
   * Remove program info from localStorage
   */
  static reset() {
    localStorage.removeItem(this._PROGRAM_INFO_KEY);
  }

  /**
   * @returns program keypair from localStorage
   */
  static getKp() {
    const kpBuffer = this.getProgramInfo().kp;
    if (!kpBuffer) return { err: "Invalid keypair" };

    const programKp = Keypair.fromSecretKey(new Uint8Array(kpBuffer));
    return { programKp };
  }

  /**
   * Create a new program keypair and override the previous one if it exists
   * @returns the new generated keypair
   */
  static createNewKp() {
    const kp = Keypair.generate();
    this.update({
      kp: Array.from(kp.secretKey),
    });
    return kp;
  }

  /**
   * Gets public key that was set by user.
   *
   * This has higher priority than default generated program public key.
   *
   * @returns custom program public key if it exists
   */
  static getCustomPk() {
    const customPkStr = this.getProgramInfo().customPk;

    if (customPkStr) return new PublicKey(customPkStr);
  }

  /**
   * Gets program public key.
   *
   * Prioritizes custom public key if it exists
   */
  static getPk() {
    const result = this.getKp();
    const customPk = this.getCustomPk();
    if (result.err && !customPk) return { err: result.err };

    const programPk = customPk ?? result.programKp!.publicKey;

    return { programPk };
  }

  /**
   * Fetch the Anchor IDL from chain.
   *
   * NOTE: This is a reimplementation of `anchor.Program.fetchIdl` because that
   * function only returns the IDL and not the IDL authority.
   *
   * @param programId optional program id
   * @returns the IDL and the authority of the IDL or `null` if IDL doesn't exist
   */
  static async getIdlFromChain(programId?: PublicKey) {
    if (!programId) {
      const programPkResult = PgProgramInfo.getPk();
      if (programPkResult.err) {
        throw new Error(programPkResult.err);
      }
      programId = programPkResult.programPk!;
    }

    const idlPk = await idlAddress(programId);

    const conn = await PgConnection.get();
    const accountInfo = await conn.getAccountInfo(idlPk);
    if (!accountInfo) {
      return null;
    }

    // Chop off account discriminator
    const idlAccount = decodeIdlAccount(accountInfo.data.slice(8));
    const { inflate } = await import("pako");
    const inflatedIdl = inflate(idlAccount.data);
    const idl: Idl = JSON.parse(utils.bytes.utf8.decode(inflatedIdl));

    return { idl, authority: idlAccount.authority };
  }

  /** localStorage key */
  private static readonly _PROGRAM_INFO_KEY = "programInfo";
}
