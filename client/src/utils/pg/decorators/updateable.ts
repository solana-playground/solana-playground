import { PgCommon } from "../common";
import type { PgDisposable } from "../types";

/** State getter property */
const STATE_PROPERTY = "state";

/** Change event function name prefix */
const ON_DID_CHANGE = "onDidChange";

/** `state` property */
type State<T> = Readonly<{
  /** All internal state */
  [K in typeof STATE_PROPERTY]: T;
}>;

/** `init` property */
type Initialize = {
  /** Initializer that returns a disposable */
  init(): PgDisposable;
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
  onDidChange(cb: (value: T) => void): PgDisposable;
} & {
  [K in keyof T as `${typeof ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: T[K]) => void
  ) => PgDisposable;
};

/** Custom storage type */
type CustomStorage<T> = {
  /** Read from storage and deserialize the data. */
  read(): T;
  /** Serialize the data and write to storage. */
  write(state: T): void;
};

/**
 * Make a static class updateable.
 *
 * This decorator defines getters for the given property names and adds an
 * `onDidChange${propertyName}` method for each property.
 *
 * `update` method is responsible for both updating the state and dispatching
 * change events.
 *
 * NOTE: Types have to be added separately as decorators don't have proper
 * type support.
 *
 * @param properties declare the properties of the class
 */
export function updateable<T>(params: {
  /** Default value to set */
  defaultState: Required<T>;
  /** Storage that is responsible with de/serialization */
  storage: CustomStorage<T>;
}) {
  return (sClass: any) => {
    const INTERNAL_STATE_PROPERTY = "_state";
    sClass[INTERNAL_STATE_PROPERTY] ??= {};

    // Initializer
    (sClass as Initialize).init = () => {
      const state = params.storage.read();

      for (const property in state) {
        // Remove extra properties, this could happen if a property was removed
        if (params.defaultState[property] === undefined) {
          delete state[property];
        }
      }

      for (const property in params.defaultState) {
        // If any property is missing, set the default
        if (state[property as keyof T] === undefined) {
          state[property as keyof T] = params.defaultState[property];
        }
      }

      sClass.update(state);
      return sClass.onDidChange((state: T) => params.storage.write(state));
    };

    // Define state getter
    Object.defineProperty(sClass, STATE_PROPERTY, {
      get: () => sClass[INTERNAL_STATE_PROPERTY],
    });

    for (const property in params.defaultState) {
      // Change event handlers
      const onDidChangeEventName =
        ON_DID_CHANGE + property[0].toUpperCase() + property.slice(1);
      sClass[onDidChangeEventName] = (cb: (value: any) => void) => {
        return PgCommon.onDidChange({
          cb,
          eventName: sClass._getChangeEventName(property),
          initialRun: { value: sClass[property] },
        });
      };
    }

    // Main change event
    (sClass as OnDidChangeEventName<T>).onDidChange = (
      cb: (value: T) => void
    ) => {
      return PgCommon.onDidChange({
        cb,
        eventName: sClass._getChangeEventName(),
        initialRun: { value: sClass[STATE_PROPERTY] },
      });
    };

    // Update method
    (sClass as Update<T>).update = (params: Partial<T>) => {
      for (const property in params) {
        if (property !== undefined) {
          sClass[INTERNAL_STATE_PROPERTY][property] = params[property];

          PgCommon.createAndDispatchCustomEvent(
            sClass._getChangeEventName(property),
            sClass[property]
          );
        }
      }

      // Dispatch main update event, must be later than properties in order to
      // send the latest class in the callback
      PgCommon.createAndDispatchCustomEvent(
        sClass._getChangeEventName(),
        sClass[STATE_PROPERTY]
      );
    };

    // Get custom event name
    sClass._getChangeEventName = (name?: string) => {
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
    Initialize &
    State<T> &
    Update<T> &
    OnDidChangeEventName<T>;
};
