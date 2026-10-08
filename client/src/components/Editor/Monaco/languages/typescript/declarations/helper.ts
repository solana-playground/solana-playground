import * as monaco from "monaco-editor";

import {
  Disposable,
  MergeUnion,
  OrString,
  PgCommon,
  PgJsPackage,
  PgSettings,
} from "../../../../../../utils";

/** Global packages */
type GlobalPackages = typeof PACKAGES["global"];

/** Global package name */
type GlobalPackageName = keyof GlobalPackages;

/** ESM import style */
type PackageImportStyle = GlobalPackages[GlobalPackageName];

/**
 * Declare global namespace.
 *
 * @param packageName package name to be referenced in declaration files
 * @param importStyle import style of the package
 * @returns a dispose method to dispose all events
 */
export const declareNamespace = (
  packageName: OrString<GlobalPackageName>,
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

/**
 * Declare a module if it hasn't been declared already.
 *
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param packageName package name to be referenced in declaration files
 * @param mod contents of the module
 * @returns module declaration for the given package
 */
export const declareModule = (packageName: string, mod: string = "") => {
  if (
    mod.includes(`declare module "${packageName}"`) ||
    mod.includes(`declare module '${packageName}'`)
  ) {
    return mod;
  }
  return `declare module "${packageName}" { ${mod} }`;
};

/**
 * Declare a full package (cached).
 *
 * @param packageName package name to be referenced in declaration files
 * @param opts declare options
 * - `empty`: whether the package should be declared as an empty module
 * - `transitive`: whether the package is a transitive package
 * @returns a dispose method to dispose all events or `undefined` if the
 * package has already been declared
 */
export const declarePackage = async (
  packageName: string,
  opts?: { empty?: boolean; transitive?: boolean }
): Promise<Disposable | undefined> => {
  if (cache.has(packageName)) return;

  if (opts?.empty) {
    return monaco.languages.typescript.typescriptDefaults.addExtraLib(
      declareModule(packageName)
    );
  }

  cache.add(packageName);

  const types = await getTypes(packageName).catch((e) => {
    console.log("Failed to get types:", packageName, e);
  });
  if (!types) {
    cache.delete(packageName);
    return;
  }

  const { manifest, files } = types;

  // Type root is always the first index (sorted by the server)
  const typeRootFile = files[0];

  // Make the package discoverable by declaring it as a module
  const parts = typeRootFile[0].split("/");
  typeRootFile[0] = parts
    .map((part, i) => (i === parts.length - 1 ? "old-index.d.ts" : part))
    .join("/");
  const [oldIndexPath] = typeRootFile;

  const oldIndexCodePath = oldIndexPath
    // TODO: Remove
    .replace(PgSettings.experimental.unstable ? "" : "node_modules/", "")
    // Always use `<package>` for `@types/<package>` imports to avoid:
    //
    // ```
    // Cannot import type declaration files. Consider importing 'mocha/old-index'
    // instead of '@types/mocha/old-index'.
    // ```
    .replace("@types/", "")
    .replace(".d.ts", "");

  // Always declare `@types/<package>` as `<package>` to avoid:
  //
  // ```
  // File 'file:///node_modules/@types/bn.js/index.d.ts' is not a module.
  // ```
  const declaredPackageName = packageName.replace("@types/", "");

  // Fix being unable to export CommonJS modules:
  //
  // ```
  // Module '"file:///node_modules/@types/bn.js/old-index"' uses 'export =' and
  // cannot be used with 'export *'.
  // ```
  const commonJsExport = /export\s+=\s+(\w+)/.exec(typeRootFile[1])?.[1];
  const mod = commonJsExport
    ? `import ${commonJsExport} from "${oldIndexCodePath}";
       export default ${commonJsExport};`
    : `export * from "${oldIndexCodePath}";`;

  // Renaming exports allows us to export everything
  files.push([
    oldIndexPath.replace("old-index", "index"),
    declareModule(declaredPackageName, mod),
  ]);

  // TODO: Monaco TS worker historically had a problem about directory imports
  // and exports not working without an explicit `/index` suffix. See
  // https://github.com/solana-playground/solana-playground/blob/7d9f365a5009fd65aaa388e85bc541e5f4f51ae9/client/scripts/generate-packages.mjs#L253-L257
  //
  // It looks like this issue may have been fixed, as it does not reproduce atm,
  // but make sure that's actually the case before removing this comment.

  // Add all files
  const disposables = files.map(([path, content]) => {
    if (PgSettings.experimental.unstable) {
      path = PgCommon.joinPaths("node_modules", path);
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
    const deps = Object.keys(PgJsPackage.getAllDependencies(manifest));
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

/** Get type declarations. */
// TODO: Remove this and inline once the feature stabilizes.
const getTypes = async (
  packageName: string
): ReturnType<typeof PgJsPackage["getTypes"]> => {
  if (!PgSettings.experimental.unstable) {
    const files = await PgCommon.fetchJson(
      `/packages/${packageName}/types.json`
    );
    const dependencies: string[] = await PgCommon.fetchJson(
      `/packages/${packageName}/deps.json`
    );
    return {
      files,
      manifest: {
        dependencies: dependencies.reduce((acc, cur) => {
          acc[cur] = "0.0.0";
          return acc;
        }, {} as Record<string, string>),
      },
    };
  }

  return await PgJsPackage.getTypes(packageName);
};

/** Declared package names cache */
const cache = new Set<string>();
