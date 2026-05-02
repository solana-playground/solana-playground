import { getAnchorProgram } from "./program";
import { PgCommon } from "../common";
import type { PgWeb3 } from "../web3";

/**
 * Fetch the given on-chain account.
 *
 * @param accountName name of the account
 * @param address public key of the account
 * @returns the account
 */
export const fetchAccount = async (
  accountName: string,
  address: PgWeb3.PublicKey
) => {
  const account = getAccountClient(accountName);
  return await account.fetch(address);
};

/**
 * Fetch all of the accounts that match the account type.
 *
 * @param accountName name of the account
 * @returns the all accounts
 */
export const fetchAllAccounts = async (accountName: string) => {
  const account = getAccountClient(accountName);
  return await account.all();
};

/**
 * Get account builder client for the given `accountName`.
 *
 * @param accountName name of the account
 * @returns the account builder client
 */
const getAccountClient = (accountName: string) => {
  const program = getAnchorProgram();
  return program.account[PgCommon.toCamelCase(accountName)];
};
