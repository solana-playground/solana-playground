import * as monaco from "monaco-editor";

import { declarePackage } from "./helper";
import { Disposable, MergeUnion, PgCommon } from "../../../../../../utils/pg";

/** Global packages */
type GlobalPackages = typeof PACKAGES["global"];

/** Global package name */
type GlobalPackageName = keyof GlobalPackages;

/** ESM import style */
type PackageImportStyle = GlobalPackages[GlobalPackageName];

/**
 * Load typescript declarations in the editor.
 *
 * Only the packages specified in this function are loaded by default for
 * performance reasons.
 *
 * This function will only declare the default types once.
 */
export const declareGlobalTypes = async (): Promise<Disposable> => {
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
    declareNamespace("solana-playground", { as: "pg" }),
  ];

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

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};

/**
 * Declare global namespace.
 *
 * @param packageName package name to be referenced in declaration files
 * @param importStyle import style of the package
 * @returns a dispose method to dispose all events
 */
const declareNamespace = (
  packageName: GlobalPackageName,
  importStyle: PackageImportStyle
) => {
  const style = importStyle as Partial<MergeUnion<PackageImportStyle>>;
  const name = style.as ?? style.named ?? style.default;
  const importStyleText = style.as
    ? `* as ${style.as}`
    : style.named
    ? `{ ${style.named} }`
    : style.default;

  return monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `import ${importStyleText} from "${packageName}";
export = ${name};
export as namespace ${name};`,
    `${name}-ns.d.ts`
  );
};
