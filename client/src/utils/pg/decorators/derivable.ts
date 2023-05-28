import {
  INTERNAL_STATE_PROPERTY,
  IS_INITIALIZED_PROPERTY,
  ON_DID_CHANGE,
} from "./common";
import { PgCommon } from "../common";
import type {
  InitializeSync,
  OnDidChangeDefault,
  OnDidChangeProperty,
} from "./types";
import type { Disposable } from "../types";

/**
 * Make the given static class derivable.
 *
 * This decorator defines properties from the given state keys and they will be
 * updated based on the given `onChange` event.
 *
 * The properties are read-only and the only way to update the values is
 * to trigger the given `onChange` method.
 */
export function derivable<T extends Derivable>(state: { [key: string]: T }) {
  return (sClass: any) => {
    sClass[INTERNAL_STATE_PROPERTY] ??= {};
    sClass[IS_INITIALIZED_PROPERTY] ??= false;

    (sClass as InitializeSync).init = () => {
      const disposables: Disposable[] = [];

      for (const prop in state) {
        // Define getter
        Object.defineProperty(sClass, prop, {
          get: () => sClass[INTERNAL_STATE_PROPERTY][prop],
        });

        const derivable = state[prop];
        const disposable = derivable.onChange((value) => {
          sClass[INTERNAL_STATE_PROPERTY][prop] = derivable.derive(value);

          // Prop change event
          PgCommon.createAndDispatchCustomEvent(
            getChangeEventName(prop),
            sClass[prop]
          );

          // Main change event
          PgCommon.createAndDispatchCustomEvent(
            getChangeEventName(),
            sClass[INTERNAL_STATE_PROPERTY]
          );
        });
        disposables.push(disposable);
      }

      sClass[IS_INITIALIZED_PROPERTY] = true;

      return {
        dispose: () => {
          disposables.forEach((disposable) => disposable.dispose());
        },
      };
    };

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
      const onDidChangeEventName = ON_DID_CHANGE + PgCommon.capitalize(prop);
      sClass[onDidChangeEventName] = (cb: (value: unknown) => unknown) => {
        return PgCommon.onDidChange({
          cb,
          eventName: getChangeEventName(prop),
          initialRun: sClass[IS_INITIALIZED_PROPERTY]
            ? { value: sClass[prop] }
            : undefined,
        });
      };
    }

    // Get custom event name
    const getChangeEventName = (name?: string) => {
      return "ondidchange" + sClass.name + (name ?? "");
    };

    // Main change event
    const onDidChange = (cb: (value: unknown) => void) => {
      return PgCommon.onDidChange({
        cb,
        eventName: getChangeEventName(),
        initialRun: sClass[IS_INITIALIZED_PROPERTY]
          ? { value: sClass[INTERNAL_STATE_PROPERTY] }
          : undefined,
      });
    };
  };
}

/** Derivable property declaration */
type Derivable<T = any, R = unknown> = {
  /** The method that the value will be derived from. */
  derive: (value: T) => R;
  /** Derive method will be called whenever there is a change. */
  onChange: (cb: (value: T) => void) => Disposable;
};

/** Derivable state properties */
type DerivableState<T> = {
  readonly // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [K in keyof T]: T[K] extends Derivable<infer _, infer R> ? R : never;
};

/**
 * Create a derivable.
 *
 * This function is a type helper function.
 */
export const createDerivable = <T, R>(derivable: Derivable<T, R>) => derivable;

/**
 * Add necessary types to the given derivable static class.
 *
 * @param sClass static class
 * @param state state properties that will be added to the given class
 * @returns the static class with correct types
 */
export const declareDerivable = <C, T>(sClass: C, state: T) => {
  return sClass as Omit<C, "prototype"> &
    InitializeSync &
    DerivableState<T> &
    OnDidChangeDefault<DerivableState<T>> &
    OnDidChangeProperty<DerivableState<T>>;
};
