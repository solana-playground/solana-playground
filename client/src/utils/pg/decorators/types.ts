import type { PROPS } from "./common";
import type { Disposable, SyncOrAsync } from "../types";

/** Initable decorator */
export type Initable = {
  /** Initialize the decorator functionality */
  [PROPS.INIT]: () => SyncOrAsync<Disposable>;
};

/** Default `onDidChange` type */
export type OnDidChangeDefault<T> = {
  /**
   * The main on change handler.
   *
   * @param cb callback function to run after the change
   * @returns a dispose function to clear the event
   */
  [PROPS.ON_DID_CHANGE]: (cb: (value: T) => void) => Disposable;
};

/** Non-recursive `onDidChange${propertyName}` method types */
export type OnDidChangeProperty<T> = {
  [K in keyof T as `${typeof PROPS.ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: T[K]) => void
  ) => Disposable;
};
