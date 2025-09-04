import { addInit } from "./common";
import type { Initable } from "./types";

/**
 * Make the given static class initable.
 *
 * This decorator allows customizing the initialization process of the class.
 */
export function initable(params: {
  /** Callback to run to initialize */
  init?: Parameters<typeof addInit>[1];
  /**
   * Callback to run after initialization.
   *
   * This is intended to be used with other decorators that also add `init`
   * functions, such as `derivable` and `updatable`. This decorator makes sure
   * the `onDidInit` callback runs last independent of the other decorators
   * that are applied to the class.
   */
  onDidInit?: Parameters<typeof addInit>[2];
}) {
  return (sClass: any) => addInit(sClass, params.init, params.onDidInit);
}

/**
 * Add necessary types to the given initable static class.
 *
 * This is not necessary if the type of the class already has the `init`
 * property coming from other initable decorators such as `derivable` and
 * `updatable`.
 *
 * @param sClass static class
 * @returns the static class with correct types
 */
export const declareInitable = <C>(sClass: C) => {
  return sClass as Omit<C, "prototype"> & Initable;
};
