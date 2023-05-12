import { Idl, utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  decodeIdlAccount,
  idlAddress,
} from "@project-serum/anchor/dist/cjs/idl";

import { PgCommon } from "./common";
import { PgConnection } from "./connection";
import { EventName } from "../../constants";

export interface ProgramInfo {
  uuid?: string;
  kp?: Array<number> | null;
  customPk?: string | null;
  idl?: Idl | null;
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
    const newProgramInfo = this.getProgramInfo();
    for (const key in params) {
      // @ts-ignore
      if (params[key] !== undefined) newProgramInfo[key] = params[key];
    }

    localStorage.setItem(
      this._PROGRAM_INFO_KEY,
      JSON.stringify(newProgramInfo)
    );

    // Dispatch change events
    PgCommon.createAndDispatchCustomEvent(
      EventName.PROGRAM_INFO_ON_DID_CHANGE,
      newProgramInfo
    );

    if (params.uuid !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.PROGRAM_INFO_ON_DID_CHANGE_UUID,
        params.uuid
      );
    }
    if (params.kp !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.PROGRAM_INFO_ON_DID_CHANGE_KP,
        params.kp
      );
    }
    if (params.customPk !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.PROGRAM_INFO_ON_DID_CHANGE_CUSTOM_PK,
        params.customPk
      );
    }
    if (params.kp !== undefined || params.customPk !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.PROGRAM_INFO_ON_DID_CHANGE_PK,
        this.getPk().programPk
      );
    }
    if (params.idl !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.PROGRAM_INFO_ON_DID_CHANGE_IDL,
        params.idl
      );
    }
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
    return null;
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

  /**
   * @param cb callback function to run after program info change
   * @returns a dispose function to clear the event
   */
  static onDidChangeProgramInfo(cb: (programInfo: ProgramInfo) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE,
      initialValue: PgProgramInfo.getProgramInfo(),
    });
  }

  /**
   * @param cb callback function to run after program uuid change
   * @returns a dispose function to clear the event
   */
  static onDidChangeUuid(cb: (uuid: ProgramInfo["uuid"]) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE_UUID,
      initialValue: PgProgramInfo.getProgramInfo().uuid,
    });
  }

  /**
   * @param cb callback function to run after program keypair change
   * @returns a dispose function to clear the event
   */
  static onDidChangeKeypair(cb: (keypair: Keypair) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE_KP,
      initialValue: PgProgramInfo.getKp().programKp,
    });
  }

  /**
   * @param cb callback function to run after program pubkey change
   * @returns a dispose function to clear the event
   */
  static onDidChangePk(cb: (customPk: PublicKey) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE_PK,
      initialValue: PgProgramInfo.getPk().programPk,
    });
  }

  /**
   * @param cb callback function to run after program custom pubkey change
   * @returns a dispose function to clear the event
   */
  static onDidChangeCustomPk(cb: (customPk: PublicKey | null) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE_CUSTOM_PK,
      initialValue: PgProgramInfo.getCustomPk(),
    });
  }

  /**
   * @param cb callback function to run after program idl change
   * @returns a dispose function to clear the event
   */
  static onDidChangeIdl(cb: (idl: ProgramInfo["idl"]) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PROGRAM_INFO_ON_DID_CHANGE_IDL,
      initialValue: PgProgramInfo.getProgramInfo().idl,
    });
  }

  /** localStorage key */
  private static readonly _PROGRAM_INFO_KEY = "programInfo";
}
