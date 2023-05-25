import { PgCommon } from "../common";
import type { Disposable, SyncOrAsync } from "../types";

/** Change event function name prefix */
const ON_DID_CHANGE = "onDidChange";

/** `init` prop */
type Initialize = {
  /** Initializer that returns a disposable */
  init(): SyncOrAsync<Disposable>;
};

/** Updateable decorator */
type Update<T> = {
  /** Update state */
  update(params: Partial<T>): void;
};

/** All `onDidChange${propertyName}` method types */
type OnDidChangeEventName<T> = {
  /**
   * @param cb callback function to run after the change
   * @returns a dispose function to clear the event
   */
  onDidChange(cb: (value: T) => void): Disposable;
} & {
  [K in keyof T as `${typeof ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: T[K]) => void
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
 * Make a static class updateable.
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
export function updateable<T>(params: {
  /** Default value to set */
  defaultState: Required<T>;
  /** Storage that is responsible with de/serialization */
  storage: CustomStorage<T>;
  /** Whether to add proxy setters recursively */
  recursive?: boolean;
}) {
  return (sClass: any) => {
    const INTERNAL_STATE_PROPERTY = "_state";
    const IS_INITIALIZED_PROPERTY = "_isinitialized";
    sClass[INTERNAL_STATE_PROPERTY] ??= {};
    sClass[IS_INITIALIZED_PROPERTY] ??= false;

    // Initializer
    (sClass as Initialize).init = async () => {
      const state: T = await params.storage.read();

      // Set the default if any prop is missing(recursively)
      const setMissingDefaults = (state: any, defaultState: any) => {
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

      sClass.update(state);
      sClass[IS_INITIALIZED_PROPERTY] = true;

      return sClass.onDidChange((state: T) => params.storage.write(state));
    };

    // Main change event
    (sClass as OnDidChangeEventName<T>).onDidChange = (
      cb: (value: T) => void
    ) => {
      return PgCommon.onDidChange({
        cb,
        eventName: sClass._getChangeEventName(),
        initialRun: sClass[IS_INITIALIZED_PROPERTY]
          ? { value: sClass[INTERNAL_STATE_PROPERTY] }
          : undefined,
      });
    };

    let defineObjectSubProperties:
      | ((getter: any, internal: any, propNames: string[]) => any)
      | undefined;
    if (params.recursive) {
      defineObjectSubProperties = (
        getter: any,
        internal: any,
        propNames: string[]
      ) => {
        getter = new Proxy(internal, {
          set(target: any, prop: any, value: any) {
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
                  PgCommon.getProperty(sClass, prop)
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

          sClass[onDidChangeEventName] ??= (
            cb: (value: unknown) => unknown
          ) => {
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
            getter[prop] = defineObjectSubProperties!(
              getter[prop],
              internal[prop],
              currentPropNames
            );
          } else {
            // Trigger the setter
            // eslint-disable-next-line no-self-assign
            getter[prop] = getter[prop];
          }
        }

        return getter;
      };
    }

    // Update method
    (sClass as Update<T>).update = (updateParams: Partial<T>) => {
      for (const prop in updateParams) {
        if (updateParams[prop] === undefined) continue;

        // Define getter and setter once
        if (sClass[prop] === undefined) {
          // Define getters and setters
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

          // Change event handlers
          const onDidChangeEventName =
            ON_DID_CHANGE + prop[0].toUpperCase() + prop.slice(1);
          sClass[onDidChangeEventName] ??= (
            cb: (value: unknown) => unknown
          ) => {
            return PgCommon.onDidChange({
              cb,
              eventName: sClass._getChangeEventName(prop),
              initialRun: sClass[IS_INITIALIZED_PROPERTY]
                ? { value: sClass[prop] }
                : undefined,
            });
          };
        }

        // Trigger the setter
        sClass[prop] = updateParams[prop];

        if (
          defineObjectSubProperties &&
          typeof updateParams[prop] === "object" &&
          updateParams[prop] !== null
        ) {
          sClass[prop] = defineObjectSubProperties(
            sClass[prop],
            sClass[INTERNAL_STATE_PROPERTY][prop],
            [prop]
          );
        }
      }
    };

    // Get custom event name
    sClass._getChangeEventName = (name?: string | string[]) => {
      if (Array.isArray(name)) name = name.join(".");
      return "ondidchange" + sClass.name + (name ?? "");
    };
  };
}

/**
 * Add the necessary types to the given updateable static class.
 *
 * @param sClass static class
 * @param state internal state type
 * @returns the static class with correct types
 */
export const declareUpdateable = <C, T>(sClass: C, state: T) => {
  return sClass as Omit<typeof sClass, "prototype"> &
    T &
    Initialize &
    Update<T> &
    OnDidChangeEventName<T>;
};
