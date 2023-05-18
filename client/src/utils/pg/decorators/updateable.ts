import { PgCommon } from "../common";
import type { PgDisposable } from "../types";

/** State getter property */
const STATE_PROPERTY = "state";

/** Change event function name prefix */
const ON_DID_CHANGE = "onDidChange";

/** `init` property */
type Initialize = {
  /** Initializer, should only be called once. */
  init(): PgDisposable;
};

/** `default` property */
type Default<T> = {
  /** Default value to set if the value doesn't exist */
  DEFAULT: T;
};

/** `state` property */
type State<T> = Readonly<{
  /** All internal state */
  [K in typeof STATE_PROPERTY]: T;
}>;

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
export function updateable<T extends object>(defaultValue: Required<T>) {
  return (sClass: any) => {
    const INTERNAL_STATE_PROPERTY = "_state";
    sClass[INTERNAL_STATE_PROPERTY] ??= {};

    // Set default value
    (sClass as Default<T>).DEFAULT = defaultValue;

    // Initializer
    (sClass as Initialize).init = () => {
      const preferences = sClass._storage.read();

      for (const property in preferences) {
        // Remove extra properties, this could happen if a property was removed
        if (sClass.DEFAULT[property] === undefined) {
          delete preferences[property];
        }
      }

      for (const property in sClass.DEFAULT) {
        // If any property is missing, set the default
        if (preferences[property] === undefined) {
          preferences[property] = sClass.DEFAULT[property];
        }
      }

      sClass.update(preferences);
      return sClass.onDidChange((state: T) => sClass._storage.write(state));
    };

    // Define state getter
    Object.defineProperty(sClass, STATE_PROPERTY, {
      get: () => sClass[INTERNAL_STATE_PROPERTY],
    });

    for (const property in defaultValue) {
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
    Default<T> &
    State<T> &
    Update<T> &
    OnDidChangeEventName<T>;
};
