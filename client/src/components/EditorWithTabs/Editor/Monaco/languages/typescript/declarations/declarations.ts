import type { Disposable } from "../../../../../../../utils/pg";

/**
 * Initialize type declarations.
 *
 * Steps:
 * 1. Declare global types
 * 2. Declare disposable types
 * 3. Declare importable types
 *
 * @returns a disposable to dispose all events
 */
export const initDeclarations = async (): Promise<Disposable> => {
  // Global declarations
  const { declareGlobalTypes } = await import("./global");
  const global = await declareGlobalTypes();

  // Disposable declarations
  const { declareDisposableTypes } = await import("./disposable");
  const disposable = declareDisposableTypes();

  // Importable declarations
  const { declareImportableTypes } = await import("./importable");
  const importable = await declareImportableTypes();

  return {
    dispose: () => {
      global.dispose();
      disposable.dispose();
      importable.dispose();
    },
  };
};
