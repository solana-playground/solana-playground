import * as monaco from "monaco-editor";
import type { Idl } from "@coral-xyz/anchor";

import { declareModule, declareNamespace } from "./helper";
import {
  Disposable,
  PgCommon,
  PgExplorer,
  PgJsPackage,
  PgProgramInfo,
  PgSettings,
  PgWallet,
} from "../../../../../../utils";

/**
 * Declare types that can change based on outside events.
 *
 * For example, `pg.wallet` will be `never` when the wallet is not connected.
 *
 * @returns a disposable to dispose all events
 */
export const declareDisposableTypes = async () => {
  const disposables: Disposable[] = [];

  // TODO: Remove check
  if (PgSettings.experimental.unstable) {
    const manifest = PgCommon.tryCall(PgJsPackage.getParsedManifest);
    if (!manifest?.dependencies) return;

    // TODO: Impl for `@solana/kit`
    // TODO: Share this with `js-runtime`
    const WEB3_JS_PKG = "@solana/web3.js";
    // Impl below assumes alphabetically ordered packages (manifest too)
    const ANCHOR_PKGS = [
      "@anchor-lang/core",
      "@coral-xyz/anchor",
      "@project-serum/anchor",
    ];
    const WEB3_JS_DEPENDENTS = [WEB3_JS_PKG, ...ANCHOR_PKGS];

    const deps = Object.keys(manifest.dependencies);
    const hasWeb3JsDep = deps.some((dep) => WEB3_JS_DEPENDENTS.includes(dep));
    if (!hasWeb3JsDep) return;

    try {
      await PgJsPackage.getTypes(WEB3_JS_PKG);
      disposables.push(declareNamespace(WEB3_JS_PKG, { as: "web3" }));
    } catch {
      return;
    }

    const anchorPkg = deps.find((dep) => ANCHOR_PKGS.includes(dep));
    if (anchorPkg) {
      try {
        await PgJsPackage.getTypes(anchorPkg);
        disposables.push(declareNamespace(anchorPkg, { as: "anchor" }));
      } catch {}
    }
  }

  // Default
  addLib("default", require("./raw/pg.raw.d.ts"));
  const pgNamespace = declareNamespace("solana-playground", { as: "pg" });
  disposables.push(pgNamespace);

  // Program id
  const programIdChange = PgProgramInfo.onDidChangePk((programId) => {
    addLib(
      "program-id",
      `/** Your program public key from playground */\nconst PROGRAM_ID: ${
        programId ? "web3.PublicKey" : "never"
      };`
    );
  });
  disposables.push(programIdChange);

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
  disposables.push(walletChange);

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
  disposables.push(accountsChange);

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
        PgExplorer.toAbsolutePath(`target/types/${idl.name}.ts`)
      )
    );

    // Workspace
    // TODO: `camelCase` program accessors on newer versions
    const getWorkspace = (packageName: string) => {
      return `import { Program } from "${packageName}";
      const workspace: { ${PgCommon.toPascalFromSnake(
        idl.name
      )}: ${programType} };`;
    };
    programDisposables.push(
      addLib(
        "@anchor-lang/core.workspace",
        declareModule("@anchor-lang/core", getWorkspace("@anchor-lang/core"))
      ),
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
  disposables.push(idlChange);

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};

/** Disposable types */
type DisposableType =
  | "default"
  | "program-id"
  | "wallet"
  | "wallets"
  | "program"
  | "@anchor-lang/core.workspace"
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
