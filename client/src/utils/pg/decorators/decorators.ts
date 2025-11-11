// Disable because `eslint` doesn't treat `@link` usage as usage.
// https://github.com/jsdoc/jsdoc/issues/1993
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PgCommon } from "../common";
import type { Disposable } from "../types";
import type {
  addInit,
  Initable,
  OnDidChangeDefault,
  OnDidChangeProperty,
} from "./common";
import type { derivable, DerivableState } from "./derivable";
import type { initable } from "./initable";
import type {
  updatable,
  OnDidChangePropertyRecursive,
  Updatable,
} from "./updatable";

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

/**
 * Add necessary types to the given decorated class.
 *
 * NOTE: This is only a type helper function because TS decorators don't have
 * proper type support.
 *
 * @param sClass static class
 * @param opts decorator options
 * @returns the static class with correct types
 */
export const declareDecorator = <C, D, U, R>(
  sClass: C,
  opts?: {
    /** {@link derivable} decorator */
    derivable?: () => D;
    /**
     * {@link initable} decorator.
     *
     * This is not necessary if the type of the class already has the `init`
     * property coming from other initable decorators such as `derivable` and
     * `updatable`.
     */
    initable?: Parameters<typeof addInit>[0];
    /** {@link updatable} decorator */
    updatable?: { defaultState: U; recursive?: R };
  }
) => {
  return sClass as unknown as Omit<C, "prototype"> &
    Initable &
    DerivableState<D> &
    U &
    Updatable<U> &
    OnDidChangeDefault<DerivableState<D> & U> &
    OnDidChangeProperty<DerivableState<D>> &
    (R extends boolean
      ? OnDidChangePropertyRecursive<U>
      : OnDidChangeProperty<U>);
};
