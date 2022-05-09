import { Idl } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

interface ProgramInfo {
  update?: number;
  uuid?: string;
  kp?: Array<number> | null;
  idl?: Idl | null;
  customPk?: string;
}

export class PgProgramInfo {
  private static PROGRAM_INFO_KEY = "programInfo";

  static getProgramInfo() {
    const programInfo: ProgramInfo = JSON.parse(
      localStorage.getItem(this.PROGRAM_INFO_KEY) || "{}"
    );
    return programInfo;
  }

  static update(params: ProgramInfo) {
    const programInfo: ProgramInfo = this.getProgramInfo();

    if (params.kp) programInfo.kp = params.kp;
    if (params.update !== undefined) programInfo.update = params.update;
    if (params.uuid) programInfo.uuid = params.uuid;
    if (params.idl !== undefined) programInfo.idl = params.idl;
    if (params.customPk) programInfo.customPk = params.customPk;

    localStorage.setItem(this.PROGRAM_INFO_KEY, JSON.stringify(programInfo));
  }

  static getKp() {
    const kpBuffer = this.getProgramInfo().kp;
    if (!kpBuffer) return { err: "Invalid keypair" };

    const programKp = Keypair.fromSecretKey(new Uint8Array(kpBuffer));
    return { programKp };
  }

  private static getCustomPk() {
    const customPkStr = this.getProgramInfo().customPk;

    if (customPkStr) return new PublicKey(customPkStr);
  }

  /**
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
