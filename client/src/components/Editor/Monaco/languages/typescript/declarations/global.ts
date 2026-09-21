import * as monaco from "monaco-editor";

import { declareNamespace, declarePackage } from "./helper";
import { PgCommon, PgSettings } from "../../../../../../utils";

/**
 * Load global type declarations in the editor.
 *
 * Only the packages specified in this function are loaded by default for
 * performance reasons.
 */
export const declareGlobalTypes = async () => {
  const disposables = [
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      require("./raw/globals.raw.d.ts")
    ),
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      require("./raw/console.raw.d.ts")
    ),
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      require("./raw/light-dom.raw.d.ts")
    ),
  ];

  // TODO: Remove
  if (!PgSettings.experimental.unstable) {
    await Promise.all(
      PgCommon.entries(PACKAGES.global).map(
        async ([packageName, importStyle]) => {
          const pkg = await declarePackage(packageName);
          if (pkg) {
            disposables.push(pkg, declareNamespace(packageName, importStyle));
          }
        }
      )
    );
  }

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};
