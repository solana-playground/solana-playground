import { declarePackage } from "./helper";
import { importTypes } from "../../common";
import type { ClientPackageName, Disposable } from "../../../../../../utils/pg";

/**
 * Declare importable types in the editor and update them based on file switch
 * or the current editor model's content change.
 */
export const declareImportableTypes = () => {
  return importTypes(
    (model) => update(model.getValue()),
    ["javascript", "typescript"]
  );
};

/** Mapping of package name -> imported */
const cachedTypes: {
  [K in ClientPackageName]?: true | Disposable;
} = {};

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
  await Promise.all(
    PACKAGES.importable.map(async (packageName) => {
      const pkg = cachedTypes[packageName];
      if (pkg === true) return;

      if (new RegExp(`("|')${packageName}("|')`, "gm").test(code)) {
        await declarePackage(packageName);

        // Dispose the old filler declaration if it exists
        pkg?.dispose();

        // Declaration is final, this package will not get declared again
        cachedTypes[packageName] = true;
      } else if (!pkg) {
        // Declare empty package to give the completion hint that the package
        // can be imported
        cachedTypes[packageName] = await declarePackage(packageName, {
          empty: true,
        });
      }
    })
  );
};
