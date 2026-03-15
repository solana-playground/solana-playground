import { PgCommon } from "../common";
import { addInit, addOnDidChange, getChangePropName, PROPS } from "./common";
import type { Disposable } from "../types";

/**
 * Make the given static class derivable.
 *
 * This decorator defines properties from the given state keys and they will be
 * updated based on the given `onChange` event(s).
 *
 * The properties are read-only and the only way to update the values is
 * to trigger the given `onChange` method(s).
 */
export function derivable<T extends Derivable>(
  deriveState: () => { [key: string]: T }
) {
  return (sClass: any) => {
    // Add `init` method
    addInit(sClass, () => {
      const state = deriveState();

      // Add `onDidChange` methods
      addOnDidChange(sClass, state);

      const disposables: Disposable[] = [];
      for (const prop in state) {
        // Define getter
        if (!Object.hasOwn(sClass, prop)) {
          Object.defineProperty(sClass, prop, {
            get: () => sClass[PROPS.INTERNAL_STATE][prop],
          });
        }

        const derivable = state[prop];
        const derive: typeof derivable["derive"] = async (value) => {
          if (!derivable.canThrow) return await derivable.derive(value);

          try {
            return await derivable.derive(value);
          } catch {
            return null;
          }
        };
        const disposable = PgCommon.batchChanges(
          async (value) => {
            sClass[PROPS.INTERNAL_STATE][prop] = await derive(value);
            sClass[PROPS.DISPATCH_CHANGE_EVENT](prop);
          },
          PgCommon.toArray(derivable.onChange).map((onChange) => {
            if (typeof onChange === "string") {
              return sClass[getChangePropName(onChange)];
            }

            return onChange;
          })
        );
        disposables.push(disposable);
      }

      return {
        dispose: () => disposables.forEach(({ dispose }) => dispose()),
      };
    });
  };
}

/** Either `onChange` method or a string that will be checked from the state */
type OnChange<T = unknown> = ((cb: (value?: T) => void) => Disposable) | string;

/** Derivable property declaration */
type Derivable<T = any, R = unknown, C extends boolean = boolean> = {
  /** The method that the value will be derived from. */
  derive: (value: T) => R;
  /** Derive method will be called whenever there is a change. */
  onChange: OnChange<T> | OnChange[];
  /** Whether the `derive` method can throw an error */
  canThrow?: C;
};

/** Derivable state properties */
export type DerivableState<T> = {
  readonly // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [K in keyof T]: T[K] extends Derivable<infer _, infer R, infer C>
    ? C extends true
      ? Awaited<R | null>
      : Awaited<R>
    : never;
};

/**
 * Create a derivable.
 *
 * This function is a type helper function.
 */
export const createDerivable = <T, R, C extends boolean = false>(
  derivable: Derivable<T, R, C>
) => derivable;
