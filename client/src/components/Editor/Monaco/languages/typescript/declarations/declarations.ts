import { declareDisposableTypes } from "./disposable";
import { declareGlobalTypes } from "./global";
import { declareImportableTypes } from "./importable";
import type { Disposable } from "../../../../../../utils/pg";

/**
 * Initialize type declarations.
 *
 * Steps:
 * 1. Declare global and importable types
 * 2. Declare disposable types
 *
 * @returns a disposable to dispose all events
 */
export const initDeclarations = async (): Promise<Disposable> => {
  const [global, importable] = await Promise.all([
    declareGlobalTypes(),
    declareImportableTypes(),
  ]);
  const disposable = declareDisposableTypes();

  return {
    dispose: () => {
      global.dispose();
      importable.dispose();
      disposable.dispose();
    },
  };
};
