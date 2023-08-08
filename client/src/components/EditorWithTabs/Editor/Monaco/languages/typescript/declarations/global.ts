import * as monaco from "monaco-editor";

import { declareFullModule } from "./helper";
import type {
  ClientPackageName,
  MergeUnion,
} from "../../../../../../../utils/pg";

/** Packages that are available globally(without importing) */
const GLOBAL_PACKAGES: ClientPackageName[] = [
  "@project-serum/anchor",
  "@solana/buffer-layout",
  "@solana/web3.js",
  "assert",
  "bn.js",
  "borsh",
  "buffer",
  "mocha",
];

/** Whether the global types have been declared. */
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

  /* -------------------------- Begin types -------------------------- */
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/globals.raw.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/console.raw.d.ts")
  );

  for (const packageName of GLOBAL_PACKAGES) {
    await declareFullModule(packageName);
  }
  /* -------------------------- End types -------------------------- */

  /* -------------------------- Begin namespaces -------------------------- */
  declareNamespace("@project-serum/anchor", { as: "anchor" });
  declareNamespace("@solana/buffer-layout", { as: "BufferLayout" });
  declareNamespace("@solana/web3.js", { as: "web3" });
  declareNamespace("assert", { as: "assert" });
  declareNamespace("buffer", { named: "Buffer" });
  declareNamespace("bn.js", { as: "BN" });
  declareNamespace("borsh", { as: "borsh" });
  declareNamespace("solana-playground", { as: "pg" });
  /* -------------------------- End namespaces -------------------------- */

  loaded = true;
};

/**
 *
 * @param packageName package name t obe referenced in declaration files
 * @param importStyle import style of the package
 * @returns a dispose method to dispose all events
 */
const declareNamespace = (
  packageName: ClientPackageName,
  importStyle: { as: string } | { named: string }
) => {
  const opts = importStyle as Partial<MergeUnion<typeof importStyle>>;
  const name = opts.as ?? opts.named;
  const importStyleText = opts.as ? `* as ${opts.as}` : `{ ${opts.named} }`;
  return monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `import ${importStyleText} from "${packageName}";
export = ${name};
export as namespace ${name};`,
    `${name}-ns.d.ts`
  );
};
