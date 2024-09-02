import * as monaco from "monaco-editor";
import type { Idl } from "@coral-xyz/anchor";

import { declareModule } from "./helper";
import {
  ClientPackageName,
  Disposable,
  PgCommon,
  PgExplorer,
  PgProgramInfo,
  PgWallet,
} from "../../../../../../utils/pg";

/**
 * Declare types that can change based on outside events.
 *
 * For example, `pg.wallet` will be `never` when the wallet is not connected.
 *
 * @returns a disposable to dispose all events
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

  // Playground wallet
  const PG_WALLET_TYPE = "PgWallet";
  const walletChange = PgWallet.onDidChangeCurrent((wallet) => {
    const walletType = wallet
      ? wallet.isPg
        ? PG_WALLET_TYPE
        : getWalletTypeName(wallet.name)
      : "never";

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

  // Anchor program
  let programDisposables: monaco.IDisposable[] = [];
  const idlChange = PgProgramInfo.onDidChangeIdl((idl) => {
    if (!idl) {
      // Dispose the program types if there is no IDL otherwise the types will
      // leak between workspaces if the previous workspace has an IDL but the
      // current doesn't.
      programDisposables.forEach((disposable) => disposable.dispose());
      programDisposables = [];
      return;
    }

    const convertedIdl = JSON.stringify(convertIdl(idl));

    // Program
    const programType = `Program<${convertedIdl}>`;
    programDisposables.push(
      addLib(
        "program",
        `/** Your Anchor program */
const program: anchor.${programType};`
      )
    );

    // target/types
    const idlTypeName = PgCommon.toPascalFromSnake(idl.name);
    programDisposables.push(
      addModel(
        "target/types",
        `export type ${idlTypeName} = ${convertedIdl};
export const IDL: ${idlTypeName} = ${convertedIdl};`,
        PgExplorer.convertToFullPath(`target/types/${idl.name}.ts`)
      )
    );

    // Workspace
    const getWorkspace = (packageName: ClientPackageName) => {
      return `import { Program } from "${packageName}";
      const workspace: { ${PgCommon.toPascalFromSnake(
        idl.name
      )}: ${programType} };`;
    };
    programDisposables.push(
      addLib(
        "@coral-xyz/anchor.workspace",
        declareModule("@coral-xyz/anchor", getWorkspace("@coral-xyz/anchor"))
      ),
      addLib(
        "@project-serum/anchor.workspace",
        declareModule(
          "@project-serum/anchor",
          getWorkspace("@project-serum/anchor")
        )
      )
    );
  });

  return {
    dispose: () => {
      programIdChange.dispose();
      walletChange.dispose();
      accountsChange.dispose();
      idlChange.dispose();
    },
  };
};

/** Disposable types */
type DisposableType =
  | "default"
  | "program-id"
  | "wallet"
  | "wallets"
  | "program"
  | "@coral-xyz/anchor.workspace"
  | "@project-serum/anchor.workspace"
  | "target/types";

/** Caching the disposables in order to get rid of the old declarations */
const disposableCache: { [K in DisposableType]?: monaco.IDisposable } = {};

/**
 * Add declaration file and remove the old one if it exists.
 *
 * @param disposableType name to keep track of the disposable in `disposableCache`
 * @param lib content
 * @returns a disposable to dispose the library
 */
const addLib = (disposableType: DisposableType, lib: string) => {
  disposableCache[disposableType]?.dispose();
  disposableCache[disposableType] =
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      lib.includes("declare module")
        ? lib
        : declareModule("solana-playground", lib),
      // `anchor.workspace` is not getting disposed without file path
      `/disposables/${disposableType}.d.ts`
    );

  return disposableCache[disposableType]!;
};

/**
 * Add model and remove the old one if it exists.
 *
 * @param disposableType name to keep track of the disposable in `disposableCache`
 * @param content code
 * @param filePath model URI
 * @returns a disposable to dispose the model
 */
const addModel = (
  disposableType: DisposableType,
  content: string,
  filePath: string
) => {
  disposableCache[disposableType]?.dispose();
  disposableCache[disposableType] = monaco.editor.createModel(
    content,
    undefined,
    monaco.Uri.parse(filePath)
  );

  return disposableCache[disposableType]!;
};

/**
 * Convert Anchor IDL's account names into camelCase to be used accuretely for types.
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
