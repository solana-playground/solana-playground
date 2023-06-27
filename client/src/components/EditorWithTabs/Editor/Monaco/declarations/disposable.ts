import * as monaco from "monaco-editor";
import type { Idl } from "@project-serum/anchor";

import { declareModule } from "./helper";
import {
  Disposable,
  PgCommon,
  PgProgramInfo,
  PgWallet,
} from "../../../../../utils/pg";

/**
 * Declare types that can change based on outside events.
 *
 * For example, `pg.wallet` will be `undefined` when the wallet is not connected.
 *
 * @returns a dispose function to dispose all
 */
export const declareDisposableTypes = (): Disposable => {
  addLib("default", require("./raw/pg.raw.d.ts"));

  // Program id
  const programIdChange = PgProgramInfo.onDidChangePk((programId) => {
    addLib(
      "program-id",
      `/** Your program public key from playground */\nconst PROGRAM_ID: ${
        programId ? "web3.PublicKey" : "never"
      };`
    );
  });

  // Anchor program
  const idlChange = PgProgramInfo.onDidChangeIdl((idl) => {
    if (idl) {
      addLib(
        "program",
        `/** Your Anchor program */\nconst program: anchor.Program<${JSON.stringify(
          convertIdl(idl)
        )}>;`
      );
    }
  });

  // Playground wallet
  const PG_WALLET_TYPE = "PgWallet";
  const walletChange = PgWallet.onDidChangeCurrent((wallet) => {
    let walletType: string;

    if (!wallet) walletType = "never";
    else if (wallet.isPg) walletType = PG_WALLET_TYPE;
    else walletType = getWalletTypeName(wallet.name);

    addLib(
      "wallet",
      `
  ${
    wallet
      ? `/**
  * Current connected wallet.
  *
  * NOTE: You can toggle connection with \`connect\` command.
  */`
      : `/** You are not connected. Use \`connect\` command to connect. */`
  }
  const wallet: ${walletType};
`
    );
  });

  // Wallets
  const accountsChange = PgCommon.batchChanges(() => {
    // Get Playground Wallet
    const pgWalletsType = PgWallet.accounts
      .map((acc) => PgCommon.toCamelCase(acc.name))
      .reduce((acc, cur, i) => {
        if (i === 0) return `"${cur}"`;
        return acc + ` | "${cur}"`;
      }, "");

    // Get Standard Wallets
    const standarWalletNames = PgWallet.getConnectedStandardWallets().map(
      (wallet) => wallet.name
    );
    const standardWalletsTypeDeclarations = standarWalletNames.reduce(
      (acc, cur) =>
        acc + `interface ${getWalletTypeName(cur)} extends DefaultWallet {}`,
      ""
    );
    const standardWalletsType = standarWalletNames.reduce(
      (acc, cur) =>
        acc + `& { ${PgCommon.toCamelCase(cur)}: ${getWalletTypeName(cur)} }`,
      ""
    );

    const walletsType = `{ [K in ${pgWalletsType}]: ${PG_WALLET_TYPE} } ${standardWalletsType}`;

    addLib(
      "wallets",
      `
  ${standardWalletsTypeDeclarations}

  type Wallets = ${walletsType};

  /** All available wallets by their camelCase names */
  const wallets: ${PgWallet.current ? "Wallets" : "never"};
`
    );
  }, [PgWallet.onDidChangeAccounts, PgWallet.onDidChangeCurrent]);

  return {
    dispose: () => {
      programIdChange.dispose();
      idlChange.dispose();
      walletChange.dispose();
      accountsChange.dispose();
    },
  };
};

/** Disposable types */
type DisposableType =
  | "default"
  | "program-id"
  | "program"
  | "wallet"
  | "wallets";

/** Caching the disposables in order to get rid of the old declarations */
const disposableCache: { [key in DisposableType]?: monaco.IDisposable } = {};

/** Add declaration file and remove the old one if it exists */
const addLib = (disposable: DisposableType, lib: string) => {
  disposableCache[disposable]?.dispose();
  disposableCache[disposable] =
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      lib.includes("declare module")
        ? lib
        : declareModule("solana-playground", lib)
    );
};

/**
 * Convert Anchor IDL's account names into camelCase to be used accuretely for types
 *
 * @param idl Anchor IDL
 * @returns converted Anchor IDL
 */
const convertIdl = (idl: Idl) => {
  if (!idl.accounts) return idl;

  let newIdl: Idl = { ...idl, accounts: [] };

  for (const account of idl.accounts) {
    newIdl.accounts!.push({
      ...account,
      name: account.name[0].toLowerCase() + account.name.substring(1),
    });
  }

  return newIdl;
};

/**
 * Get the wallet's type name.
 *
 * @param walletName wallet name
 * @returns wallet's type name
 */
const getWalletTypeName = (walletName: string) => walletName + "Wallet";
