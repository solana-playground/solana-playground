import { Idl } from "@project-serum/anchor";
import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@project-serum/anchor/dist/cjs/utils/token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

import { PgCommon, PgTest, PgWallet } from "../";

export class PgAccount {
  /**
   * @returns the account data of the given address based on `accountName`
   */
  static async fetchOne(
    accountName: string,
    address: PublicKey,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const account = this._getAccount(accountName, idl, conn, wallet);
    const accountData = await account.fetch(address);
    return accountData;
  }

  /**
   * @returns all account data based on `accountName`
   */
  static async fetchAll(
    accountName: string,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const account = this._getAccount(accountName, idl, conn, wallet);
    const allAccountData = await account.all();
    return allAccountData;
  }

  /**
   * @returns account public key as string or empty string if the name is unknown
   */
  static getKnownAccount(name: string) {
    const pk = this._getKnownAccountPk(name);
    return pk?.toBase58() ?? "";
  }

  /**
   *
   * @returns Anchor client account based on `accountName`
   */
  private static _getAccount(
    accountName: string,
    idl: Idl,
    conn: Connection,
    wallet: PgWallet | AnchorWallet
  ) {
    const program = PgTest.getProgram(idl, conn, wallet);
    const account = program.account[PgCommon.toCamelCase(accountName)];
    return account;
  }

  /**
   * @returns known account public key from given name
   */
  private static _getKnownAccountPk(name: string) {
    switch (name) {
      case "systemProgram":
        return SystemProgram.programId;
      case "tokenProgram":
        return TOKEN_PROGRAM_ID;
      case "associatedTokenProgram":
        return ASSOCIATED_PROGRAM_ID;
      case "tokenMetadataProgram":
        return new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      case "clock":
        return SYSVAR_CLOCK_PUBKEY;
      case "rent":
        return SYSVAR_RENT_PUBKEY;
      default:
        return null;
    }
  }
}
