import { Idl } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

const PROGRAM_INFO_LS = "programInfo";

interface ProgramInfo {
  update?: number;
  uuid?: string;
  kp?: Buffer | null;
  idl?: Idl | null;
  deployed?: boolean;
}

export class PgProgramInfo {
  static getProgramInfo() {
    const programInfo: ProgramInfo = JSON.parse(
      localStorage.getItem(PROGRAM_INFO_LS) || "{}"
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

    localStorage.setItem(PROGRAM_INFO_LS, JSON.stringify(programInfo));
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
