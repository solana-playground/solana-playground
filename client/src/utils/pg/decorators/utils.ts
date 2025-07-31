import { PgCommon } from "../common";
import type { Initable } from "./types";
import type { Disposable } from "../types";

/**
 * Initialize all of the given `initables` without having to care about the
 * initialization order.
 *
 * If an initable (A) depends on another initable (B), the dependency (B) needs
 * to be initialized before the dependent (A). This function handles the
 * ordering by retrying to initialize with different orders until all of the
 * given `initiables` are initialized.
 *
 * @param initables initables to initialize (order doesn't matter)
 * @returns a disposable
 */
export const initAll = async (initables: Initable[]): Promise<Disposable> => {
  const disposables = Array.from<Disposable | null>({
    length: initables.length,
  }).fill(null);
  let prevRemainingIndices: number[] | undefined;

  do {
    const remainingIndices = disposables
      .map((v, i) => (v ? null : i))
      .filter(PgCommon.isNonNullish);

    if (PgCommon.isEqual(remainingIndices, prevRemainingIndices)) {
      remainingIndices.push(remainingIndices.shift()!);
    }

    for (const i of remainingIndices) {
      try {
        disposables[i] = await initables[i].init();
      } catch {}
    }

    prevRemainingIndices = remainingIndices;
  } while (prevRemainingIndices.length);

  return {
    dispose: () => {
      (disposables as Disposable[]).forEach(({ dispose }) => dispose());
    },
  };
};
