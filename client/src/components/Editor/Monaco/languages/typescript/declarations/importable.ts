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

  const manifest = await PgJsPackage.getParsedManifest();
  if (!manifest.dependencies) return;

  const disposables = await Promise.all(
    Object.keys(manifest.dependencies).map((name) => declarePackage(name))
  ).then((disposables) => disposables.filter(PgCommon.isNonNullish));
  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
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
