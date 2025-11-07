import { addInit, addOnDidChange, PROPS } from "./common";
import { PgCommon } from "../common";
import type {
  Initable,
  OnDidChangeDefault,
  OnDidChangeProperty,
} from "./types";
import type { Disposable, SyncOrAsync } from "../types";

/** Updatable decorator */
type Updatable<T> = {
  /** Update state. */
  [PROPS.UPDATE]: (params: Partial<T>) => void;
  /** Refresh state (from storage if it exists). */
  [PROPS.REFRESH]: () => SyncOrAsync<void>;
};

/** Recursive `onDidChange${propertyName}` method types */
type OnDidChangePropertyRecursive<T, U = FlattenObject<T>> = {
  [K in keyof U as `${typeof PROPS.ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: U[K]) => void
  ) => Disposable;
};

/** Custom storage implementation */
type CustomStorage<T> = {
  /** Read from storage and deserialize the data. */
  read(): SyncOrAsync<T>;
  /** Serialize the data and write to storage. */
  write(state: T): SyncOrAsync<void>;
};

/**
 * Make a static class updatable.
 *
 * This decorator defines getters for the given prop names and adds an
 * `onDidChange${propertyName}` method for each prop.
 *
 * `update` method is responsible for both updating the state and dispatching
 * change events.
 *
 * NOTE: Types have to be added separately as decorators don't have proper
 * type support.
 */
export function updatable<T extends Record<string, any>>(params: {
  /** Default value to set */
  defaultState: Required<T>;
  /** Storage that is responsible with de/serialization */
  storage?: CustomStorage<T>;
  /** Whether to add proxy setters recursively */
  recursive?: boolean;
  /** Migrate data (runs before everything else in `init` and `refresh`) */
  migrate?: () => SyncOrAsync<Array<{ from: string; to: string }> | void>;
}) {
  return (sClass: any) => {
    // Add `onDidChange` methods
    addOnDidChange(sClass, params.defaultState, params.recursive);

    // Add `init` method
    addInit(sClass, async () => {
      // Set the internal state
      await sClass[PROPS.REFRESH]();

      // Define getters and setters
      for (const prop in sClass[PROPS.INTERNAL_STATE]) {
        if (Object.hasOwn(sClass, prop)) continue;

        Object.defineProperty(sClass, prop, {
          get: () => sClass[PROPS.INTERNAL_STATE][prop],
          set: (value: T[keyof T]) => {
            sClass[PROPS.INTERNAL_STATE][prop] = value;
            sClass[PROPS.DISPATCH_CHANGE_EVENT](prop);
          },
        });

        if (params.recursive) recursivelyDefineSetters(sClass, [prop]);
      }

      // Save to storage on change
      if (!params.storage) return;

      // NOTE: Creating a new callback is necessary here, otherwise `this`
      // keyword becomes unusable in `storage.write`.
      return sClass[PROPS.ON_DID_CHANGE](
        (state: T & Record<string, unknown>) => {
          // At the time of writing this comment, all decorators use the same
          // internal state, meaning `state` may include fields comnig from other
          // decorators such as `derivable`. This is mainly because there are some
          // methods such as `onDidChange` that require the aggregated state value
          // to be used. This also allows using common functionality to implement
          // the decorators. However, in the future, especially if we decide to
          // add more decorators that use the same internal state, it might be
          // worth creating a separate internal state field for each. For now,
          // it's sufficient to just remove the fields that aren't defined in
          // `params.defaultState` from the `state` variable.

          // NOTE: `removeExtraProperties` function cannot be used here because
          // we'd need to clone the `state` in order to not remove the internal
          // state fields, and `structuredClone` is not guaranteed to work for
          // all `derivable` fields.
          const updatableState = PgCommon.entries(state).reduce(
            (acc, [prop, value]) => {
              if (params.defaultState[prop] !== undefined) acc[prop] = value;
              return acc;
            },
            {} as T
          );

          params.storage!.write(updatableState);
        }
      );
    });

    // Add `update` method
    (sClass as Updatable<T>)[PROPS.UPDATE] = (params) => {
      for (const [prop, value] of Object.entries(params)) {
        if (value !== undefined) sClass[prop] = value;
      }
    };

    // Add `refresh` method
    (sClass as Updatable<T>)[PROPS.REFRESH] = async () => {
      // Migrate if needed
      const migrations = await params.migrate?.();

      const state: T = params.storage
        ? await params.storage.read()
        : params.defaultState;

      if (migrations) {
        for (const migration of migrations) {
          // Get old value
          let value;
          try {
            value = PgCommon.getValue(state, migration.from);
          } catch {
            // The value has already been migrated
            continue;
          }

          // Set parents to empty objects if needed
          const to = PgCommon.normalizeAccessor(migration.to);
          for (const i in to) {
            PgCommon.getValue(state, to.slice(0, +i))[to[i]] ??= {};
          }

          // Set new value
          PgCommon.setValue(state, to, value);

          // The deletion of the old value will be handled in `removeExtraProperties`
        }
      }

      // Set the default if any prop is missing (recursively)
      const setMissingDefaults = (state: any, defaultState: any) => {
        if (Array.isArray(state)) return;

        for (const prop in defaultState) {
          if (state[prop] === undefined) {
            state[prop] = defaultState[prop];
          } else if (
            typeof state[prop] === "object" &&
            defaultState[prop] !== null
          ) {
            setMissingDefaults(state[prop], defaultState[prop]);
          }
        }
      };
      setMissingDefaults(state, params.defaultState);

      // Remove extra properties if a prop was removed (recursively)
      const removeExtraProperties = (state: any, defaultState: any) => {
        if (Array.isArray(state)) return;

        for (const prop in state) {
          if (defaultState[prop] === undefined) {
            delete state[prop];
          } else if (
            typeof state[prop] === "object" &&
            defaultState[prop] !== null
          ) {
            removeExtraProperties(state[prop], defaultState[prop]);
          }
        }
      };
      removeExtraProperties(state, params.defaultState);

      // Set internal state fields individually to keep `derivable` fields
      for (const [prop, value] of Object.entries(state)) {
        sClass[PROPS.INTERNAL_STATE][prop] = value;
      }

      if (sClass[PROPS.IS_INITIALIZED]) {
        // Dispatch change events by self-assigning the innermost values, which
        // will also trigger the change events of its parent fields (change
        // events bubble up).
        //
        // NOTE: This part assumes change events always bubble up. If we ever
        // change it to bubble down (e.g. in `recursivelyDefineSetters`), we'd
        // need to update this part too.
        const selfAssignInnerFields = (state: any, accessor: string[] = []) => {
          for (const [prop, value] of Object.entries(state)) {
            if (
              params.recursive &&
              typeof value === "object" &&
              value !== null
            ) {
              selfAssignInnerFields(value, [...accessor, prop]);
            } else {
              PgCommon.setValue(sClass, [...accessor, prop], value);
            }
          }
        };
        selfAssignInnerFields(state);
      }
    };
  };
}

/** Define proxy setters for properties recursively. */
const recursivelyDefineSetters = (sClass: any, accessor: string[]) => {
  const internalValue = PgCommon.getValue(
    sClass[PROPS.INTERNAL_STATE],
    accessor
  );
  if (typeof internalValue !== "object" || internalValue === null) {
    // Self-assign to dispatch change events
    PgCommon.setValue(sClass[PROPS.INTERNAL_STATE], accessor, internalValue);
    return;
  }

  const proxy = new Proxy(internalValue, {
    set(target: any, prop: string, value: any) {
      target[prop] = value;

      // Setting a new value should dispatch a change event for all of the
      // parent objects. For example:
      //
      // ```
      // const obj = { nested: { number: 1 } };
      // obj.nested.number = 2;
      // ```
      //
      // Should trigger `onDidChangeNestedNumber`, `onDidChangeNested`, `onDidChange`.

      // 1. [nested].concat
      // 2. [nested, number].reduce
      // 3. [nested, nested.number].reverse
      // 4. [nested.number, nested].forEach
      accessor
        .concat([prop])
        .reduce((acc, cur, i) => {
          acc.push(accessor.slice(0, i).concat([cur]));
          return acc;
        }, [] as string[][])
        .reverse()
        .forEach(sClass[PROPS.DISPATCH_CHANGE_EVENT]);

      return true;
    },
  });
  PgCommon.setValue(sClass, accessor, proxy);

  for (const prop in proxy) {
    recursivelyDefineSetters(sClass, [...accessor, prop]);
  }
};

/**
 * Flatten the properties of the given object.
 *
 * ## Input:
 * ```ts
 * {
 *   isReady: boolean;
 *   nested: {
 *     id: number;
 *     double: {
 *       name: string;
 *     };
 *   };
 * }
 * ```
 *
 * ## Output:
 * ```ts
 * {
 *   isReady: boolean;
 *   nested: {
 *     id: number;
 *     double: {
 *       name: string;
 *     };
 *   }
 *   nestedId: number;
 *   nestedDouble: {
 *     name: string;
 *   }
 *   nestedDoubleName: string;
 * }
 * ```
 */
type FlattenObject<T, U = PropertiesToUnionOfTuples<T>> = MapNestedProperties<
  // This check solves `Type instantiation is excessively deep and possibly infinite.`
  U extends [string[], unknown] ? U : never
>;

/** Maps the given tuple to an object */
type MapNestedProperties<T extends [string[], unknown]> = {
  [K in T as Uncapitalize<JoinCapitalized<K[0]>>]: K[1];
};

/** Join the given string array capitalized */
type JoinCapitalized<T extends string[]> = T extends [
  // infer Head extends string,
  // ...infer Tail extends string[]
  infer Head,
  ...infer Tail
]
  ? Head extends string
    ? Tail extends string[]
      ? `${Capitalize<Head>}${JoinCapitalized<Tail>}`
      : never
    : never
  : "";

/** Map the property values to a union of tuples */
type PropertiesToUnionOfTuples<T, Acc extends string[] = []> = {
  [K in keyof T]: T[K] extends object
    ? [[...Acc, K], T[K]] | PropertiesToUnionOfTuples<T[K], [...Acc, K]>
    : [[...Acc, K], T[K]];
}[keyof T];

/**
 * Add the necessary types to the given updatable static class.
 *
 * @param sClass static class
 * @param options type helper options
 * @returns the static class with correct types
 */
export const declareUpdatable = <C, T, R>(
  sClass: C,
  options?: { defaultState: T; recursive?: R }
) => {
  return sClass as unknown as Omit<C, "prototype"> &
    T &
    Initable &
    Updatable<T> &
    OnDidChangeDefault<T> &
    (R extends boolean
      ? OnDidChangePropertyRecursive<T>
      : OnDidChangeProperty<T>);
};
