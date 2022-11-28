import * as vscode from "vscode";
import { Keypair } from "@solana/web3.js";

import { PgStorage } from "./storage";
import { PgFs } from "./fs";

interface ProgramInfo {
  uuid?: string;
  keypairBytes?: number[];
}

export class PgProgramInfo {
  private static readonly _KEY = "program-info";

  static get(): ProgramInfo {
    return JSON.parse(PgStorage.getItem(this._KEY) ?? JSON.stringify({}));
  }

  static update(value: Partial<ProgramInfo>) {
    PgStorage.setItem(this._KEY, JSON.stringify({ ...this.get(), ...value }));
  }

  static async getKeypairFromFs(uri: vscode.Uri) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(await PgFs.readFile(uri)))
    );
  }
}
