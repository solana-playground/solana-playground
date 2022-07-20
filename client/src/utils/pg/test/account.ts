import { Idl } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

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
}
