import { PgCommon } from "../common";
import type { OnDidChangeDefault } from "./types";
import type { Disposable, SyncOrAsync } from "../types";

/** Private state property */
export const INTERNAL_STATE_PROPERTY = "_state";

/** The property name for keeping track of whether the class has been initialized */
export const IS_INITIALIZED_PROPERTY = "_isinitialized";

/** Change event method name prefix */
export const ON_DID_CHANGE = "onDidChange";

/** Get the change event property name. */
export const getChangePropName = (prop: string) => {
  return ON_DID_CHANGE + PgCommon.capitalize(prop);
};

/**
 * Add `init` property to the given static class.
 *
 * @param sClass static class
 * @param init init method to implement
 */
export const addInit = (sClass: any, init: () => SyncOrAsync<Disposable>) => {
  sClass[INTERNAL_STATE_PROPERTY] ??= {};

  const previousInit = sClass.init;
  sClass.init = async () => {
    const disposables: Disposable[] = [];
    if (previousInit) {
      const disposable = await previousInit();
      disposables.push(disposable);
    }

    const disposable = await init();
    disposables.push(disposable);

    sClass[IS_INITIALIZED_PROPERTY] = true;

    return {
      dispose: () => {
        disposables.forEach((disposable) => disposable.dispose());
      },
    };
  };
};

/**
 * Add `onDidChange` methods to the given static class.
 *
 * @param sClass static class
 * @param state default state
 */
export const addOnDidChange = (
  sClass: any,
  state: { [key: string]: unknown }
) => {
  // Batch main change event
  (sClass as OnDidChangeDefault<unknown>).onDidChange = (
    cb: (value: unknown) => void
  ) => {
    return PgCommon.batchChanges(
      () => cb(sClass[INTERNAL_STATE_PROPERTY]),
      [onDidChange]
    );
  };

  // Property change events
  for (const prop in state) {
    sClass[getChangePropName(prop)] = (cb: (value: unknown) => unknown) => {
      return PgCommon.onDidChange({
        cb,
        eventName: sClass._getChangeEventName(prop),
        initialRun: sClass[IS_INITIALIZED_PROPERTY]
          ? { value: sClass[prop] }
          : undefined,
      });
    };
  }

  // Get custom event name
  sClass._getChangeEventName = (name?: string | string[]) => {
    if (Array.isArray(name)) name = name.join(".");
    return "ondidchange" + sClass.name + (name ?? "");
  };

  // Main change event
  const onDidChange = (cb: (value: unknown) => void) => {
    return PgCommon.onDidChange({
      cb,
      eventName: sClass._getChangeEventName(),
      initialRun: sClass[IS_INITIALIZED_PROPERTY]
        ? { value: sClass[INTERNAL_STATE_PROPERTY] }
        : undefined,
    });
  };
};
