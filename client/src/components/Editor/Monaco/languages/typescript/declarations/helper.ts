import * as monaco from "monaco-editor";

import {
  ClientPackageName,
  Disposable,
  PgCommon,
  TupleFiles,
} from "../../../../../../utils/pg";

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param packageName package name to be referenced in declaration files
 * @param module contents of the module
 * @returns module declaration for the given package
 */
export const declareModule = (
  packageName: ClientPackageName,
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
  packageName: ClientPackageName,
  opts?: { empty?: boolean; transitive?: boolean }
): Promise<Disposable | undefined> => {
  if (cache.has(packageName)) return;

  if (opts?.empty) {
    return monaco.languages.typescript.typescriptDefaults.addExtraLib(
      declareModule(packageName)
    );
  }

  cache.add(packageName);

  const files: TupleFiles = await PgCommon.fetchJSON(
    `/packages/${packageName}/types.json`
  );
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

  if (files.length > 1) {
    const [oldIndexPath] = files.find(([path]) => {
      return path.endsWith("old-index.d.ts");
    })!;

    disposables.push(
      // Renaming exports allows us to export everything
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        declareModule(
          packageName,
          `export * from "${oldIndexPath
            .replace("node_modules/", "")
            .replace(".d.ts", "")}"`
        ),
        "file:///" + oldIndexPath.replace("old-index", "index")
      )
    );
  }

  // Get the transitive dependencies of global and importable packages but do
  // not continue the recursion to get the transitive dependencies of the
  // transitive dependencies because that results in excessive amount of
  // requests without adding much benefit.
  if (!opts?.transitive) {
    const deps: ClientPackageName[] = await PgCommon.fetchJSON(
      `/packages/${packageName}/deps.json`
    );
    const transitiveDisposables = await Promise.all(
      deps.map((dep) => declarePackage(dep, { transitive: true }))
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

/** Declared package names cache */
const cache = new Set<ClientPackageName>();
