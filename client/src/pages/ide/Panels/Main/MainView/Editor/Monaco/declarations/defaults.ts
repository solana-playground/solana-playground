import * as monaco from "monaco-editor";

let loaded = false;

/**
 * Load typescript declarations for Monaco.
 *
 * Only default packages will be loaded by default for performance reasons.
 */
export const declareDefaultTypes = async () => {
  if (loaded) return;

  /* -------------------------- Begin types -------------------------- */
  // Defaults
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/console.raw.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@types/mocha/index.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@types/node/assert.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@types/node/buffer.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("bn.js", require("@types/bn.js/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("borsh", require("borsh/lib/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare(
      "@solana/buffer-layout",
      require("@solana/buffer-layout/lib/Layout.d.ts")
    )
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@solana/web3.js/lib/index.d.ts")
  );
  const { loadAnchorTypes } = await import("./packages/anchor");
  loadAnchorTypes();

  // Optionals
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("@solana/spl-token")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("@metaplex-foundation/js")
  );
  /* -------------------------- End types -------------------------- */

  /* -------------------------- Begin namespaces -------------------------- */
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/pg-ns.raw.d.ts"),
    "pg-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/web3js-ns.raw.d.ts"),
    "web3js-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/assert-ns.raw.d.ts"),
    "assert-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/bn-ns.raw.d.ts"),
    "bn-ns.raw.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/borsh-ns.raw.d.ts"),
    "borsh-ns.raw.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/buffer-layout-ns.raw.d.ts"),
    "buffer-layout-ns.raw.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/anchor-ns.raw.d.ts"),
    "anchor-ns.raw.d.ts"
  );
  /* -------------------------- End namespaces -------------------------- */

  // Globals
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./raw/globals.raw.d.ts")
  );

  loaded = true;
};

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param moduleName module name to be referenced in declaration files
 * @param module contents of the module
 * @returns declared version  of the module with `moduleName`
 */
const declare = (moduleName: string, module: string = "") => {
  return `declare module "${moduleName}" { ${module} }`;
};
