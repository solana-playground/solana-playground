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
  const [disposable, global, importable] = await Promise.all([
    // Disposable declarations
    (async () => {
      const { declareDisposableTypes } = await import("./disposable");
      return declareDisposableTypes();
    })(),
    // Global declarations
    (async () => {
      const { declareGlobalTypes } = await import("./global");
      return await declareGlobalTypes();
    })(),
    // Importable declarations
    (async () => {
      const { declareImportableTypes } = await import("./importable");
      return await declareImportableTypes();
    })(),
  ]);

  return {
    dispose: () => {
      global.dispose();
      disposable.dispose();
      importable.dispose();
    },
  };
};
