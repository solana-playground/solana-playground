import { PgCommon } from "../common";
import type { OnDidChangeDefault } from "./types";
import type { Disposable, SyncOrAsync } from "../types";

/** Private state property */
export const INTERNAL_STATE_PROPERTY = "_state";

/** The property name for keeping track of whether the class has been initialized */
const IS_INITIALIZED_PROPERTY = "_isinitialized";

/** Change event method name prefix */
export const ON_DID_CHANGE = "onDidChange";

/**
 * Get the change event property name.
 *
 * @param prop property path (e.g. `field`, `inner.field`)
 * @returns the property name for the change event
 */
export const getChangePropName = (prop: string) => {
  return prop
    .split(".")
    .reduce((acc, cur) => acc + PgCommon.capitalize(cur), ON_DID_CHANGE);
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
    disposables.push(
      { dispose: () => (sClass[IS_INITIALIZED_PROPERTY] = false) },
      { dispose: () => (sClass[INTERNAL_STATE_PROPERTY] = {}) }
    );

    return {
      dispose: () => disposables.forEach(({ dispose }) => dispose()),
    };
  };
};

/**
 * Add `onDidChange` methods to the given static class.
 *
 * @param sClass static class
 * @param state default state
 * @param recursive whether to recursively add `onDidChange` methods
 */
export const addOnDidChange = (
  sClass: any,
  state: { [key: string]: unknown },
  recursive?: boolean
) => {
  // Main change event
  (sClass as OnDidChangeDefault<unknown>).onDidChange = (
    cb: (value: unknown) => unknown
  ) => {
    return PgCommon.onDidChange(
      sClass._getChangeEventName(),
      // Debounce the main change event because each property change dispatches
      // the main change event
      PgCommon.debounce(cb),
      sClass[IS_INITIALIZED_PROPERTY]
        ? { value: sClass[INTERNAL_STATE_PROPERTY] }
        : undefined
    );
  };

  // Property change events
  for (const prop in state) {
    sClass[getChangePropName(prop)] = (cb: (value: unknown) => unknown) => {
      return PgCommon.onDidChange(
        sClass._getChangeEventName(prop),
        cb,
        sClass[IS_INITIALIZED_PROPERTY] ? { value: sClass[prop] } : undefined
      );
    };
  }

  // Recursive property change events
  if (recursive) {
    const addOnDidChangeProps = (props: string[] = []) => {
      const value = props.length ? PgCommon.getValue(state, props) : state;
      for (const prop in value) {
        const currentProps = [...props, prop];
        const currentPropPath = currentProps.join(".");
        sClass[getChangePropName(currentPropPath)] = (
          cb: (value: unknown) => unknown
        ) => {
          return PgCommon.onDidChange(
            sClass._getChangeEventName(currentPropPath),
            cb,
            sClass[IS_INITIALIZED_PROPERTY]
              ? { value: PgCommon.getValue(sClass, currentPropPath) }
              : undefined
          );
        };

        const value = PgCommon.getValue(state, currentPropPath);
        if (typeof value === "object" && value !== null) {
          addOnDidChangeProps(currentProps);
        }
      }
    };

    addOnDidChangeProps();
  }

  // Get custom event name
  sClass._getChangeEventName = (prop?: string) => {
    // `sClass.name` is minified to something like `e` in production builds
    // which cause collision with other classes and this only happens with the
    // main `onDidChange` method because the child change methods have `name`
    // appended. This results with infinite loops when using any of the main change
    // events as a dependency for a derivable, e.g. using `PgConnection.onDidChange`
    // as a dependency for `PgProgramInfo.onChain` triggers an infinite loop which
    // is only reproducable in production builds.
    // See: https://github.com/webpack/webpack/issues/8132
    // https://github.com/mishoo/UglifyJS/issues/3263
    //
    // The solution is to avoid minimizing the decorator class names in production
    // by overriding the Terser plugin's `keep_classnames` and `keep_fnames` option
    // to include only the class/function names(decorator classes can be transpiled
    // to either classes or functions depending on the browser version) that start
    // with "_Pg".
    return "ondidchange" + sClass.name + (prop ?? "");
  };

  // Dispatch change event
  sClass._dispatchChangeEvent = (prop?: string) => {
    // Only dispatch if the state has been initialized
    if (!sClass[IS_INITIALIZED_PROPERTY]) return;

    // Dispatch the prop update event if `prop` exists
    if (prop) {
      PgCommon.createAndDispatchCustomEvent(
        sClass._getChangeEventName(prop),
        PgCommon.getValue(sClass[INTERNAL_STATE_PROPERTY], prop)
      );
    }

    // Always dispatch the main update event
    PgCommon.createAndDispatchCustomEvent(
      sClass._getChangeEventName(),
      sClass[INTERNAL_STATE_PROPERTY]
    );
  };
};
