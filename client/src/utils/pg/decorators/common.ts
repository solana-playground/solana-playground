import { PgCommon } from "../common";
import type { Initialize, OnDidChangeProperty } from "./types";
import type { Disposable, SyncOrAsync } from "../types";

/** Property names */
export const PROPS = {
  /** Internal (private) state */
  INTERNAL_STATE: "_state",
  /** The property name for keeping track of whether the class has been initialized */
  IS_INITIALIZED: "_isInitialized",
  /** Initialization method name */
  INIT: "init",
  /** Update method name */
  UPDATE: "update",
  /** Change event method name (or prefix) */
  ON_DID_CHANGE: "onDidChange",
  /** Dispatch change event(s) method name */
  DISPATCH_CHANGE_EVENT: "_dispatchChangeEvent",
} as const;

/**
 * Add `init` property to the given static class.
 *
 * @param sClass static class
 * @param init init method to implement
 */
export const addInit = (sClass: any, init: () => SyncOrAsync<Disposable>) => {
  sClass[PROPS.INTERNAL_STATE] ??= {};

  const previousInit = sClass.init;
  (sClass as Initialize)[PROPS.INIT] = async () => {
    const disposables: Disposable[] = [];
    if (previousInit) {
      const disposable = await previousInit();
      disposables.push(disposable);
    }

    const disposable = await init();
    disposables.push(disposable);

    sClass[PROPS.IS_INITIALIZED] = true;
    disposables.push(
      { dispose: () => (sClass[PROPS.IS_INITIALIZED] = false) },
      { dispose: () => (sClass[PROPS.INTERNAL_STATE] = {}) }
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
  state: Record<string, unknown>,
  recursive?: boolean
) => {
  // Casting to this type is technically incorrect, but it gets the job done
  type OnDidChange = OnDidChangeProperty<typeof state>;

  // Main change event
  (sClass as OnDidChange)[getChangePropName()] = (cb) => {
    return PgCommon.onDidChange(
      getChangeEventName(),
      // Debounce the main change event because each property change dispatches
      // the main change event
      PgCommon.debounce(cb),
      sClass[PROPS.IS_INITIALIZED]
        ? { value: sClass[PROPS.INTERNAL_STATE] }
        : undefined
    );
  };

  // Property change events
  for (const prop in state) {
    (sClass as OnDidChange)[getChangePropName(prop)] = (cb) => {
      return PgCommon.onDidChange(
        getChangeEventName(prop),
        cb,
        sClass[PROPS.IS_INITIALIZED]
          ? { value: PgCommon.getValue(sClass, prop) }
          : undefined
      );
    };
  }

  // Recursive property change events
  if (recursive) {
    const addOnDidChangeProps = (props: string[] = []) => {
      const value = props.length ? PgCommon.getValue(state, props) : state;
      for (const prop in value) {
        const currentProp = [...props, prop];
        (sClass as OnDidChange)[getChangePropName(currentProp)] = (cb) => {
          return PgCommon.onDidChange(
            getChangeEventName(currentProp),
            cb,
            sClass[PROPS.IS_INITIALIZED]
              ? { value: PgCommon.getValue(sClass, currentProp) }
              : undefined
          );
        };

        const value = PgCommon.getValue(state, currentProp);
        if (typeof value === "object" && value !== null) {
          addOnDidChangeProps(currentProp);
        }
      }
    };

    addOnDidChangeProps();
  }

  // Get custom event name
  const getChangeEventName = (prop?: string | string[]) => {
    if (Array.isArray(prop)) prop = prop.join(".");

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

  // Dispatch change event(s)
  sClass[PROPS.DISPATCH_CHANGE_EVENT] = (prop?: string) => {
    // Only dispatch if the state has been initialized
    if (!sClass[PROPS.IS_INITIALIZED]) return;

    // Dispatch the prop update event if `prop` exists
    if (prop) {
      PgCommon.createAndDispatchCustomEvent(
        getChangeEventName(prop),
        PgCommon.getValue(sClass, prop)
      );
    }

    // Always dispatch the main update event
    PgCommon.createAndDispatchCustomEvent(
      getChangeEventName(),
      sClass[PROPS.INTERNAL_STATE]
    );
  };
};

/**
 * Get the change event property name.
 *
 * @param prop property path (e.g. `field`, `inner.field`)
 * @returns the property name for the change event
 */
export const getChangePropName = <T extends Record<string, unknown>>(
  prop?: string | string[]
) => {
  if (Array.isArray(prop)) prop = prop.join(".");

  return (prop ?? "")
    .split(".")
    .reduce(
      (acc, cur) => acc + PgCommon.capitalize(cur),
      PROPS.ON_DID_CHANGE
    ) as keyof OnDidChangeProperty<T>;
};
