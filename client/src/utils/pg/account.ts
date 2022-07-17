import { Idl, Program, Provider } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { PgCommon } from "./common";
import { PgProgramInfo } from "./program-info";
import { PgWallet } from "./wallet";

export class PgAccount {
  private static async getProgram(
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const provider = new Provider(conn, wallet, Provider.defaultOptions());

    // Get program pk
    const programPkResult = PgProgramInfo.getPk();
    if (programPkResult.err) throw new Error(programPkResult.err);
    const programPk = programPkResult.programPk!;

    const program = new Program(idl, programPk, provider);
    return program;
  }

  static async fetchAll(
    accountName: string,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const program = await this.getProgram(idl, conn, wallet)
    const allAccountData = await program.account[PgCommon.camelize(accountName)].all();
    return allAccountData;
  }

  static async fetchOne(
    accountName: string,
    address: PublicKey,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const program = await this.getProgram(idl, conn, wallet)
    const accountData = await program.account[PgCommon.camelize(accountName)].fetch(address);
    return accountData;
  }
}
