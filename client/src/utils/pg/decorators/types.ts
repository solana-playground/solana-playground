import type { ON_DID_CHANGE } from "./common";
import type { Disposable, SyncOrAsync } from "../types";

/** `init` prop */
export type Initialize = {
  /** Initializer that returns a disposable */
  init(): SyncOrAsync<Disposable>;
};

/** Default `onDidChange` type */
export type OnDidChangeDefault<T> = {
  /**
   * @param cb callback function to run after the change
   * @returns a dispose function to clear the event
   */
  onDidChange(cb: (value: T) => void): Disposable;
};

/** Non-recursive `onDidChange${propertyName}` method types */
export type OnDidChangeProperty<T> = {
  [K in keyof T as `${typeof ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: T[K]) => void
  ) => Disposable;
};
