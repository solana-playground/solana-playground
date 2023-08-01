import type { Disposable } from "../../../../../../../utils/pg";

/**
 * Initialize type declarations.
 *
 * Steps:
 * 1. Declare default types
 * 2. Declare disposable types
 * 3. Declare importable types
 *
 * @returns a disposable to dispose all events
 */
export const initDeclarations = async (): Promise<Disposable> => {
  // Default declarations
  const { declareDefaultTypes } = await import("./default");
  await declareDefaultTypes();

  // Disposable declarations
  const { declareDisposableTypes } = await import("./disposable");
  const disposable = declareDisposableTypes();

  // Importable declarations
  const { declareImportableTypes } = await import("./importable");
  const importable = await declareImportableTypes();

  return {
    dispose: () => {
      disposable.dispose();
      importable.dispose();
    },
  };
};
