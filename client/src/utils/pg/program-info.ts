import { Idl } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

interface ProgramInfo {
  update?: number;
  uuid?: string;
  kp?: Buffer | null;
  idl?: Idl | null;
  deployed?: boolean;
}

export class PgProgramInfo {
  private static PROGRAM_INFO_KEY = "programInfo";

  static getProgramInfo() {
    const programInfo: ProgramInfo = JSON.parse(
      localStorage.getItem(this.PROGRAM_INFO_KEY) || "{}"
    );
    return programInfo;
  }

  static updateProgramInfo(params: ProgramInfo) {
    const programInfo: ProgramInfo = this.getProgramInfo();

    if (params.kp) programInfo.kp = params.kp;
    if (params.update !== undefined) programInfo.update = params.update;
    if (params.uuid) programInfo.uuid = params.uuid;
    if (params.idl) programInfo.idl = params.idl;
    if (params.deployed) programInfo.deployed = params.deployed;

    localStorage.setItem(this.PROGRAM_INFO_KEY, JSON.stringify(programInfo));
  }

  static getProgramKp() {
    const kpBuffer = this.getProgramInfo().kp;
    if (!kpBuffer) return { err: "Invalid keypair" };

    const programKp = Keypair.fromSecretKey(new Uint8Array(kpBuffer));
    return { programKp };
  }

  static getProgramPk() {
    const result = this.getProgramKp();
    if (result.err) return { err: result.err };

    const programPk = result.programKp!.publicKey;

    return { programPk };
  }
}
