import { PgCommon } from "./common";
import type { PgDisposable, UnionToTuple } from "./types";

/** State getter property */
const STATE_PROPERTY = "state";

/** Change event function name prefix */
const ON_DID_CHANGE = "onDidChange";

/** State property */
type State<P> = Readonly<
  {
    /** All internal state */
    [K in typeof STATE_PROPERTY]: P;
  } & { [K in keyof P]: P[K] }
>;

/** Updateable decorator */
type Updateable<P> = {
  /** Update state */
  update(params: Partial<P>): void;
};

/** All `onDidChange${propertyName}` method types */
type OnDidChangeEventName<P> = {
  /**
   * @param cb callback function to run after the change
   * @returns a dispose function to clear the event
   */
  onDidChange(cb: (value: P) => void): PgDisposable;
} & {
  [K in keyof P as `${typeof ON_DID_CHANGE}${Capitalize<K>}`]: (
    cb: (value: P[K]) => void
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
export function updateable<T>(...properties: UnionToTuple<keyof T>) {
  return (sClass: any) => {
    const INTERNAL_STATE_PROPERTY = "_state";
    sClass[INTERNAL_STATE_PROPERTY] ??= {};

    // Define state getter
    Object.defineProperty(sClass, STATE_PROPERTY, {
      get: () => sClass[INTERNAL_STATE_PROPERTY],
    });

    for (const property of properties) {
      const typedProperty = property as string;

      // Define property getter
      Object.defineProperty(sClass, typedProperty, {
        get: () => sClass[INTERNAL_STATE_PROPERTY][typedProperty],
      });

      // Change event handlers
      const onDidChangeEventName =
        ON_DID_CHANGE + typedProperty[0].toUpperCase() + typedProperty.slice(1);
      sClass[onDidChangeEventName] = (cb: (value: any) => void) => {
        return PgCommon.onDidChange({
          cb,
          eventName: sClass._getChangeEventName(property),
          initialRun: { value: sClass[typedProperty] },
        });
      };
    }

    // Main change event
    sClass.onDidChange = (cb: (value: T) => void) => {
      return PgCommon.onDidChange({
        cb,
        eventName: sClass._getChangeEventName(),
        initialRun: { value: sClass[STATE_PROPERTY] },
      });
    };

    // Update method
    sClass.update = (params: Partial<T>) => {
      const paramKeys = Object.keys(params);
      if (!paramKeys) return;

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
export const declareUpdateable = <C, P>(sClass: C, state: P) => {
  return sClass as Omit<typeof sClass, "prototype"> &
    State<P> &
    Updateable<P> &
    OnDidChangeEventName<P>;
};
