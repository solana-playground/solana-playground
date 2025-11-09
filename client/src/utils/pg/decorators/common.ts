import { PgCommon } from "../common";
import type { Initable, OnDidChangeProperty } from "./types";
import type { Accessor, Disposable, SyncOrAsync } from "../types";

/** Property names */
export const PROPS = {
  /** Internal (private) state */
  INTERNAL_STATE: "_state",
  /** The property name for keeping track of whether the class has been initialized */
  IS_INITIALIZED: "_isInitialized",
  /** Initialization method name */
  INIT: "init",
  /** The property name for keeping track of all `init` functions */
  INITS: "_inits",
  /** Update method name */
  UPDATE: "update",
  /** Refresh state method name */
  REFRESH: "refresh",
  /** Change event method name (or prefix) */
  ON_DID_CHANGE: "onDidChange",
  /** Change event method name (or prefix) */
  ON_DID_INIT: "_onDidChange",
  /** Dispatch change event(s) method name */
  DISPATCH_CHANGE_EVENT: "_dispatchChangeEvent",
} as const;

/**
 * Add `init` property to the given static class.
 *
 * @param sClass static class
 * @param init init method to implement
 */
export const addInit = (
  sClass: any,
  init?: () => SyncOrAsync<Disposable | void>,
  onDidInit?: () => SyncOrAsync<Disposable | void>
) => {
  sClass[PROPS.INTERNAL_STATE] ??= {};
  sClass[PROPS.INITS] ??= [];
  if (init) sClass[PROPS.INITS].push(init);
  if (onDidInit) sClass[PROPS.ON_DID_INIT] = onDidInit;

  (sClass as Initable)[PROPS.INIT] = async () => {
    const disposables: Disposable[] = [];
    for (const init of sClass[PROPS.INITS]) {
      const maybeDisposable = await init();
      if (maybeDisposable) disposables.push(maybeDisposable);
    }

    sClass[PROPS.IS_INITIALIZED] = true;

    if (sClass[PROPS.ON_DID_INIT]) {
      const maybeDisposable = await sClass[PROPS.ON_DID_INIT]();
      if (maybeDisposable) disposables.push(maybeDisposable);
    }

    disposables.push(
      { dispose: () => (sClass[PROPS.IS_INITIALIZED] = false) },
      { dispose: () => delete sClass[PROPS.ON_DID_INIT] },
      { dispose: () => (sClass[PROPS.INITS] = []) },
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
      { value: sClass[PROPS.INTERNAL_STATE] }
    );
  };

  // Property change events
  for (const prop in state) {
    (sClass as OnDidChange)[getChangePropName(prop)] = (cb) => {
      return PgCommon.onDidChange(getChangeEventName(prop), cb, {
        value: PgCommon.getValue(sClass, prop),
      });
    };
  }

  // Recursive property change events
  if (recursive) {
    const addOnDidChangeProps = (accessor: string[] = []) => {
      const value = accessor.length
        ? PgCommon.getValue(state, accessor)
        : state;
      for (const prop in value) {
        const currentAccessor = [...accessor, prop];
        (sClass as OnDidChange)[getChangePropName(currentAccessor)] = (cb) => {
          return PgCommon.onDidChange(getChangeEventName(currentAccessor), cb, {
            value: PgCommon.getValue(sClass, currentAccessor),
          });
        };

        const value = PgCommon.getValue(state, currentAccessor);
        if (typeof value === "object" && value !== null) {
          addOnDidChangeProps(currentAccessor);
        }
      }
    };

    addOnDidChangeProps();
  }

  // Get custom event name
  const getChangeEventName = (accessor: Accessor = []) => {
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
    return (
      "ondidchange" +
      sClass.name +
      PgCommon.normalizeAccessor(accessor).join(".")
    );
  };

  // Dispatch change event(s)
  sClass[PROPS.DISPATCH_CHANGE_EVENT] = (accessor?: Accessor) => {
    // Only dispatch if the state has been initialized
    if (!sClass[PROPS.IS_INITIALIZED]) return;

    // Dispatch the prop update event if `prop` exists
    if (accessor) {
      PgCommon.createAndDispatchCustomEvent(
        getChangeEventName(accessor),
        PgCommon.getValue(sClass, accessor)
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
 * @param accessor property accessor (e.g. `field`, `inner.field`)
 * @returns the property name for the change event
 */
export const getChangePropName = <T extends Record<string, unknown>>(
  accessor: Accessor = []
) => {
  return PgCommon.normalizeAccessor(accessor).reduce(
    (acc, cur) => acc + PgCommon.capitalize(cur),
    PROPS.ON_DID_CHANGE
  ) as keyof OnDidChangeProperty<T>;
};
