import * as monaco from "monaco-editor";

import { declareModule } from "./helper";

let loaded = false;

/**
 * Load typescript declarations in the editor.
 *
 * Only the packages specified in this function are loaded by default for
 * performance reasons.
 *
 * This function will only declare the default types once.
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
    declareModule("bn.js", require("@types/bn.js/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declareModule("borsh", require("borsh/lib/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declareModule(
      "@solana/buffer-layout",
      require("@solana/buffer-layout/lib/Layout.d.ts")
    )
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@solana/web3.js/lib/index.d.ts")
  );
  const { default: declareAnchor } = await import("./packages/anchor");
  declareAnchor();
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
