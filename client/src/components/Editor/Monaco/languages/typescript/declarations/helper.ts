import * as monaco from "monaco-editor";

import {
  Disposable,
  JsRuntimePackageName,
  PgCommon,
  PgServer,
} from "../../../../../../utils";

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param packageName package name to be referenced in declaration files
 * @param module contents of the module
 * @returns module declaration for the given package
 */
export const declareModule = (
  packageName: JsRuntimePackageName,
  module: string = ""
) => {
  return `declare module "${packageName}" { ${module} }`;
};

/**
 * Declare a full package(cached).
 *
 * @param packageName package name to be referenced in declaration files
 * @param opts declare options
 * - `transitive`: Whether the package is a transitive package
 * @returns a dispose method to dispose all events or `undefined` if the
 * package has already been declared
 */
export const declarePackage = async (
  packageName: JsRuntimePackageName,
  opts?: { empty?: boolean; transitive?: boolean }
): Promise<Disposable | undefined> => {
  if (cache.has(packageName)) return;

  if (opts?.empty) {
    return monaco.languages.typescript.typescriptDefaults.addExtraLib(
      declareModule(packageName)
    );
  }

  cache.add(packageName);

  const { files, dependencies } = await getTypes(packageName);
  if (files.length > 1) {
    // Type root is always the first index (sorted by the server)
    const typeRootFile = files[0];
    const parts = typeRootFile[0].split("/");
    typeRootFile[0] = parts
      .map((part, i) => (i === parts.length - 1 ? "old-index.d.ts" : part))
      .join("/");
    const [oldIndexPath] = typeRootFile;

    // Renaming exports allows us to export everything
    files.push([
      oldIndexPath.replace("old-index", "index"),
      declareModule(
        packageName,
        `export * from "${oldIndexPath
          .replace("node_modules/", "")
          .replace(".d.ts", "")}"`
      ),
    ]);
  }

  // TODO: Monaco TS worker historically had a problem about directory imports
  // and exports not working without an explicit `/index` suffix. See
  // https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs#L253-L257
  //
  // It looks like this issue may have been fixed, as it does not reproduce atm,
  // but make sure that's actually the case before removing this comment.

  // Add all files
  const disposables = files.map(([path, content]) => {
    // Declare module on `index.d.ts` if it's not declared
    if (files.length === 1 && !content.includes("declare module")) {
      content = declareModule(packageName, content);
    }

    return monaco.languages.typescript.typescriptDefaults.addExtraLib(
      content,
      "file:///" + path
    );
  });

  // Get the transitive dependencies of global and importable packages but do
  // not continue the recursion to get the transitive dependencies of the
  // transitive dependencies because that results in excessive amount of
  // requests without adding much benefit.
  if (!opts?.transitive) {
    const transitiveDisposables = await Promise.all(
      dependencies.map((dep) => {
        return declarePackage(dep as JsRuntimePackageName, {
          transitive: true,
        });
      })
    );
    disposables.push(...transitiveDisposables.filter(PgCommon.isNonNullish));
  }

  return {
    dispose: () => {
      disposables.forEach(({ dispose }) => dispose());
      cache.delete(packageName);
    },
  };
};

/** Get type declarations. */
// TODO: Remove this and inline `PgServer.types` once the feature stabilizes.
const getTypes = async (
  packageName: JsRuntimePackageName
): ReturnType<typeof PgServer["types"]> => {
  if (process.env.NODE_ENV === "production") {
    const files = await PgCommon.fetchJSON(
      `/packages/${packageName}/types.json`
    );
    const dependencies = await PgCommon.fetchJSON(
      `/packages/${packageName}/deps.json`
    );
    return { files, dependencies };
  }

  return await PgServer.types(packageName);
};

/** Declared package names cache */
const cache = new Set<JsRuntimePackageName>();
