import * as monaco from "monaco-editor";

import { declarePackage } from "./helper";
import type {
  ClientPackageName,
  MergeUnion,
} from "../../../../../../../utils/pg";

/** Global package in `[package name, import style]` format */
type GlobalPackage = Parameters<typeof declareNamespace>;

/** Packages that are available globally(without importing) */
const GLOBAL_PACKAGES: GlobalPackage[] = [
  ["@project-serum/anchor", { as: "anchor" }],
  ["@solana/buffer-layout", { as: "BufferLayout" }],
  ["@solana/web3.js", { as: "web3" }],
  ["assert", { as: "assert" }],
  ["bn.js", { as: "BN" }],
  ["borsh", { as: "borsh" }],
  ["buffer", { named: "Buffer" }],
  ["mocha", { as: "mocha" }],
];

/** Whether the global types have been declared */
let loaded = false;

/**
 * Load typescript declarations in the editor.
 *
 * Only the packages specified in this function are loaded by default for
 * performance reasons.
 *
 * This function will only declare the default types once.
 */
export const declareGlobalTypes = async () => {
  if (loaded) return;

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/globals.raw.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/console.raw.d.ts")
  );

  for (const globalPackage of GLOBAL_PACKAGES) {
    await declarePackage(globalPackage[0]);
    declareNamespace(...globalPackage);
  }

  // Playground utilities
  declareNamespace("solana-playground", { as: "pg" });

  loaded = true;
};

/**
 * Declare global namespace.
 *
 * @param packageName package name to be referenced in declaration files
 * @param importStyle import style of the package
 * @returns a dispose method to dispose all events
 */
const declareNamespace = (
  packageName: ClientPackageName,
  importStyle: { as: string } | { named: string }
) => {
  const style = importStyle as Partial<MergeUnion<typeof importStyle>>;
  const name = style.as ?? style.named;
  const importStyleText = style.as ? `* as ${style.as}` : `{ ${style.named} }`;

  return monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `import ${importStyleText} from "${packageName}";
export = ${name};
export as namespace ${name};`,
    `${name}-ns.d.ts`
  );
};
