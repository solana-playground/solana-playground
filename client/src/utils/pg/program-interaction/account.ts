import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

import { getAnchorProgram } from "./programs";
import { PgCommon } from "../common";
import type { OrString } from "../types";

/**
 * Fetch the given on-chain account.
 *
 * @param accountName name of the account
 * @param address public key of the account
 * @returns the account
 */
export const fetchAccount = async (accountName: string, address: PublicKey) => {
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

/**
 * Get the public key of known accounts, e.g. `systemProgram`.
 *
 * @param name name of the account
 * @returns account public key as string or empty string if the name is unknown
 */
export const getKnownAccountKey = <
  T extends typeof KNOWN_ACCOUNT_KEYS,
  N extends OrString<keyof T>
>(
  name: N
) => {
  return (KNOWN_ACCOUNT_KEYS[name as keyof typeof KNOWN_ACCOUNT_KEYS] ??
    null) as N extends keyof T ? T[N] : string | null;
};

/* Known account name -> account key map */
const KNOWN_ACCOUNT_KEYS = {
  systemProgram: SystemProgram.programId.toBase58(),
  tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
  associatedTokenProgram: ASSOCIATED_PROGRAM_ID.toBase58(),
  tokenMetadataProgram: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  clock: SYSVAR_CLOCK_PUBKEY.toBase58(),
  rent: SYSVAR_RENT_PUBKEY.toBase58(),
} as const;
