import { declareDisposableTypes } from "./disposable";
import { declareGlobalTypes } from "./global";
import { declareImportableTypes } from "./importable";
import { Disposable, PgCommon } from "../../../../../../utils";

/**
 * Initialize type declarations.
 *
 * NOTE: Type declarations must be kept in sync with the `js-runtime` impl.
 *
 * @returns a disposable to dispose all events
 */
export const initDeclarations = async (): Promise<Disposable> => {
  const disposables: Disposable[] = await Promise.all([
    declareGlobalTypes(),
    declareImportableTypes(),
    declareDisposableTypes(),
  ]).then((disposables) => disposables.filter(PgCommon.isNonNullish));
  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};
