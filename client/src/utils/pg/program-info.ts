import { Idl } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

interface ProgramInfo {
  uuid?: string;
  idl?: Idl | null;
  kp?: Array<number> | null;
  customPk?: string | null;
}

export class PgProgramInfo {
  private static readonly _PROGRAM_INFO_KEY = "programInfo";

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
}
