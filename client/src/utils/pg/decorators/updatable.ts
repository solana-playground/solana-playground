import { PgCommon } from "../common";
import {
  addInit,
  addOnDidChange,
  INTERNAL_STATE_PROPERTY,
  IS_INITIALIZED_PROPERTY,
  ON_DID_CHANGE,
} from "./common";
import type {
  Initialize,
  OnDidChangeDefault,
  OnDidChangeProperty,
} from "./types";
import type { Disposable, SyncOrAsync } from "../types";

/** Updatable decorator */
type Update<T> = {
  /** Update state */
  update(params: Partial<T>): void;
};

/** Recursive `onDidChange${propertyName}` method types */
type OnDidChangePropertyRecursive<T, U = FlattenObject<T>> = {
  [K in keyof U as `${typeof ON_DID_CHANGE}${Capitalize<K>}`]: (
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
export function updatable<T>(params: {
  /** Default value to set */
  defaultState: Required<T>;
  /** Storage that is responsible with de/serialization */
  storage: CustomStorage<T>;
  /** Whether to add proxy setters recursively */
  recursive?: boolean;
}) {
  return (sClass: any) => {
    // Add `onDidChange` methods
    addOnDidChange(sClass, params.defaultState);

    // Add `init` method
    addInit(sClass, async () => {
      const state: T = await params.storage.read();

      // Set the default if any prop is missing(recursively)
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

      // Remove extra properties if a prop was removed(recursively)
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

      // Set the initial state
      sClass.update(state);

      return sClass.onDidChange((state: T) => params.storage.write(state));
    });

    // Add `update` method
    if (params.recursive) {
      (sClass as Update<T>).update = (updateParams: Partial<T>) => {
        for (const prop in updateParams) {
          update(prop, updateParams[prop]);

          if (typeof sClass[prop] === "object" && sClass[prop] !== null) {
            sClass[prop] = defineSettersRecursively({
              sClass,
              getter: sClass[prop],
              internal: sClass[INTERNAL_STATE_PROPERTY][prop],
              propNames: [prop],
            });
          }
        }
      };
    } else {
      (sClass as Update<T>).update = (updateParams: Partial<T>) => {
        for (const prop in updateParams) {
          update(prop, updateParams[prop]);
        }
      };
    }

    // Common update method
    const update = (prop: keyof T, value?: T[keyof T]) => {
      if (value === undefined) return;

      // Define getter and setter once
      if (!Object.hasOwn(sClass, prop)) {
        Object.defineProperty(sClass, prop, {
          get: () => sClass[INTERNAL_STATE_PROPERTY][prop],
          set: (value: T[keyof T]) => {
            sClass[INTERNAL_STATE_PROPERTY][prop] = value;

            // Change event
            PgCommon.createAndDispatchCustomEvent(
              sClass._getChangeEventName(prop),
              value
            );

            // Dispatch the main update event
            PgCommon.createAndDispatchCustomEvent(
              sClass._getChangeEventName(),
              sClass[INTERNAL_STATE_PROPERTY]
            );
          },
        });
      }

      // Trigger the setter
      sClass[prop] = value;
    };
  };
}

/** Define proxy setters for properties recursively. */
const defineSettersRecursively = ({
  sClass,
  getter,
  internal,
  propNames,
}: {
  sClass: any;
  getter: any;
  internal: any;
  propNames: string[];
}) => {
  getter = new Proxy(internal, {
    set(target: any, prop: string, value: any) {
      target[prop] = value;

      // Setting a new value should dispatch a change event for all of
      // the parent objects.
      // Example:
      // const obj = { nested: { number: 1 } };
      // obj.a.b = 2; -> obj.OnDidChangeNestedNumber, obj.OnDidChangeNested, obj.onDidChange

      // 1. [nested, number].reduce
      // 2. [nested, nested.number].reverse
      // 3. [nested.number, nested].forEach
      propNames
        .concat([prop])
        .reduce((acc, cur, i) => {
          acc.push(propNames.slice(0, i).concat([cur]).join("."));
          return acc;
        }, [] as string[])
        .reverse()
        .forEach((prop) => {
          PgCommon.createAndDispatchCustomEvent(
            sClass._getChangeEventName(prop),
            PgCommon.getProperty(sClass[INTERNAL_STATE_PROPERTY], prop)
          );
        });

      // Dispatch the main update event
      PgCommon.createAndDispatchCustomEvent(
        sClass._getChangeEventName(),
        sClass[INTERNAL_STATE_PROPERTY]
      );

      return true;
    },
  });

  for (const prop in getter) {
    const currentPropNames = [...propNames, prop];

    // Change event handlers
    const onDidChangeEventName =
      ON_DID_CHANGE +
      currentPropNames.reduce(
        (acc, cur) => acc + cur[0].toUpperCase() + cur.slice(1),
        ""
      );

    sClass[onDidChangeEventName] ??= (cb: (value: unknown) => unknown) => {
      return PgCommon.onDidChange({
        cb,
        eventName: sClass._getChangeEventName(currentPropNames),
        initialRun: sClass[IS_INITIALIZED_PROPERTY]
          ? { value: getter[prop] }
          : undefined,
      });
    };

    // Recursively update
    if (typeof getter[prop] === "object" && getter[prop] !== null) {
      getter[prop] = defineSettersRecursively({
        sClass,
        getter: getter[prop],
        internal: internal[prop],
        propNames: currentPropNames,
      });
    } else {
      // Trigger the setter
      // eslint-disable-next-line no-self-assign
      getter[prop] = getter[prop];
    }
  }

  return getter;
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
    Initialize &
    Update<T> &
    OnDidChangeDefault<T> &
    (R extends boolean
      ? OnDidChangePropertyRecursive<T>
      : OnDidChangeProperty<T>);
};
