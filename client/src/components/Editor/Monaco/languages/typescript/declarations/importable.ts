import * as monaco from "monaco-editor";

import { declarePackage } from "./helper";
import { importTypes } from "../../common";
import {
  Disposable,
  PgCommon,
  PgJsPackage,
  PgSettings,
} from "../../../../../../utils";

/**
 * Declare importable types in the editor and update them based on file switch
 * or the current editor model's content change.
 */
export const declareImportableTypes = async () => {
  // TODO: Remove
  if (!PgSettings.experimental.unstable) {
    return await importTypes(
      (model) => update(model.getValue()),
      ["javascript", "typescript"]
    );
  }

  const manifest = PgCommon.tryCall(PgJsPackage.getParsedManifest);
  if (!manifest?.dependencies) return;

  const deps = Object.keys(manifest.dependencies);
  const disposables = await Promise.all(
    deps.map((name) => declarePackage(name))
  ).then((disposables) => disposables.filter(PgCommon.isNonNullish));
  const disposableDeclarations = {
    dispose: () => disposables.forEach(({ dispose }) => dispose()),
  };

  // Get the transitive deps to filter out from autocomplete
  const transitiveDeps = await Promise.all(
    deps.map(async (name) => {
      const types = await PgJsPackage.getTypes(name).catch(() => {});
      if (!types) return null;
      return types.dependencies.filter((dep) => !deps.includes(dep));
    })
  )
    .then((deps) => deps.filter(PgCommon.isNonNullish).flat())
    .then(PgCommon.toUniqueArray);
  if (!transitiveDeps.length) return disposableDeclarations;

  // Filter out transitive deps by overriding `getCompletionsAtPosition`
  const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
  const worker = await getWorker();
  const { getCompletionsAtPosition } = worker;
  worker.getCompletionsAtPosition = async (...args) => {
    const result = await getCompletionsAtPosition(...args);
    result.entries = result.entries.filter(
      (entry: { name: string }) => !transitiveDeps.includes(entry.name)
    );
    return result;
  };

  return {
    dispose: () => {
      disposableDeclarations.dispose();
      worker.getCompletionsAtPosition = getCompletionsAtPosition;
    },
  };
};

/**
 * Update declared types in the editor(with cache).
 *
 * This function declares modules as empty when the package is not used in
 * the code. This allows autocompletion when importing packages and the type
 * declarations will only get loaded when the code contains the package name.
 *
 * @param code current editor content
 */
const update = async (code: string) => {
  return await Promise.all(
    PACKAGES.importable.map(async (packageName) => {
      const pkg = cache.get(packageName);
      if (pkg === true) return;

      if (new RegExp(`("|')${packageName}("|')`, "gm").test(code)) {
        await declarePackage(packageName);

        // Dispose the old filler declaration if it exists
        pkg?.dispose();

        // Declaration is final, this package will not get declared again
        cache.set(packageName, true);
      } else if (!pkg) {
        // Declare empty package to give the completion hint that the package
        // can be imported
        const disposable = await declarePackage(packageName, { empty: true });
        if (disposable) cache.set(packageName, disposable);
      }
    })
  );
};

/** Mapping of package name -> imported */
const cache = new Map<string, true | Disposable>();
