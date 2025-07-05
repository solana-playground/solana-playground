// Settings are getting loaded at the start of the application, so any non-type
// import should be avoided.

import { Endpoint } from "../../constants";
import { declareUpdatable, migratable, updatable } from "./decorators";
import type { CallableJSX, Disposable, Getable, UnionToTuple } from "./types";

type Settings = ConvertAll<UnionToTuple<InternalSettings[number]>> & {
  // TODO: Store this in `PgProgramInfo` and remove
  build: {
    flags: {
      /** Whether to enable Anchor `seeds` feature */
      seedsFeature: boolean;
      /** Whether to remove docs from the Anchor IDL */
      noDocs: boolean;
      /** Whether to enable Anchor safety checks */
      safetyChecks: boolean;
    };
  };
};

type ConvertAll<A, R = unknown> = A extends readonly [infer Head, ...infer Tail]
  ? Head extends Setting<infer I, infer V, infer C>
    ? R & ConvertAll<Tail, Convert<I, V | C>>
    : never
  : R;

type Convert<I extends string, V> = I extends ""
  ? unknown
  : I extends `${infer Head}.${infer Rest}`
  ? { [K in Head]: Convert<Rest, V> }
  : { [K in I]: V extends undefined ? boolean : V };

/** Setting creation parameter */
export type SettingParam<I extends string, V, C> = {
  /** Setting identifier (used in `PgSettings`) */
  id?: I;
  /** Name of the setting */
  name: string;
  /** Information about the setting that will be shown as a help tooltip */
  description?: string;
  /**
   * Possible values for the settings.
   *
   * If this is not set, the setting is assumed to be a checkbox.
   */
  values?: Getable<readonly Values<V>[]>;
  /** Custom value properties */
  custom?: {
    /** Parse the custom value. */
    parse: (value: string) => C;
    /** Type of the custom value e.g. URL */
    type?: string;
    /** Input placeholder */
    placeholder?: string;
    /** Additional information to display as a tip to the user (Markdown supported) */
    tip?: string;
    /**
     * Custom component to set custom values for the setting.
     *
     * This is set automatically if `Custom.tsx` file inside the setting's
     * directory exists.
     */
    Component?: CallableJSX;
  };
} & Partial<SettingsCompat<V>>;

/** Compatibility with non-standard settings (theme and font) */
// TODO: Move `PgTheme` storage to `PgSettings` and remove this
type SettingsCompat<V> = {
  /** Get current value. */
  getValue: () => V;
  /** Set current value. */
  setValue: (v: V) => unknown;
  /** Setting's `onChange` function (necessary for re-rendering on change) */
  onChange?: (cb: (v: V) => void) => Disposable;
};

/** Possible setting values */
type Values<V> =
  | V
  | { name: string; value: V }
  | { name: string; values: Values<V[]> };

/** UI Setting */
export type Setting<I extends string = string, V = any, C = any> = SettingParam<
  I,
  V,
  C
> &
  SettingsCompat<V>;

// Default values for the settings currently need to be initialized here rather
// than during settings creation in `/settings` mainly because of two reasons:
//
// 1. The initialization only requires the default values, meaning all other
//    setting fields are useless in this context.
// 2. This file has constraints on what it can import because it gets loaded
//    before everything else (even before the initial lazy loading process).
//    There is no reason to apply these constraints to `/settings`.
//
// TODO: Unless we find another way, the initialization problem i.e. having to
// make changes to this file can be fixed by adding a `defaultValue` field to
// settings and adding a script that creates the `defaultState` constant based
// on the new field.
const defaultState: Settings = {
  connection: {
    endpoint: Endpoint.DEVNET,
    commitment: "confirmed",
    preflightChecks: true,
    priorityFee: "median",
  },
  build: {
    flags: {
      seedsFeature: false,
      noDocs: true,
      safetyChecks: false,
    },
    improveErrors: true,
  },
  testUi: {
    showTxDetailsInTerminal: false,
  },
  notification: {
    showTx: true,
  },
  other: {
    blockExplorer: "Solana Explorer",
  },
  wallet: {
    automaticAirdrop: true,
  },
};

const storage = {
  /** `localStorage` key */
  KEY: "settings",

  /** Read from storage and deserialize the data. */
  read() {
    const stateStr = localStorage.getItem(this.KEY);
    if (!stateStr) return defaultState;
    return JSON.parse(stateStr) as Settings;
  },

  /** Serialize the data and write to storage. */
  write(state: Settings) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },
};

const recursive = true;

// TODO: Remove in 2024
const migrate = () => {
  const migrateFromLocalStorage = <R>(oldKey: string) => {
    const valueStr = localStorage.getItem(oldKey);
    if (!valueStr) return;

    // Remove the old key
    localStorage.removeItem(oldKey);

    return JSON.parse(valueStr) as R;
  };

  // Old settings(preferences)
  interface OldSettings {
    showTxDetailsInTerminal: boolean;
  }
  const oldSettings = migrateFromLocalStorage<OldSettings>("preferences");

  // Old connection, layout hasn't changed
  const oldConnectionConfig =
    migrateFromLocalStorage<Settings["connection"]>("connection");

  const needsMigration = !!(oldSettings && oldConnectionConfig);
  if (!needsMigration) return;

  const newValue: Settings = {
    ...defaultState,
    connection: oldConnectionConfig,
    testUi: {
      showTxDetailsInTerminal: oldSettings.showTxDetailsInTerminal,
    },
  };

  localStorage.setItem(storage.KEY, JSON.stringify(newValue));
};

@migratable(migrate)
@updatable({ defaultState, storage, recursive })
class _PgSettings {
  /** All settings */
  static all: Setting[];

  /**
   * Get the setting's implementation from its id.
   *
   * @param id setting id
   * @returns the full setting object
   */
  static get(id: string) {
    const setting = PgSettings.all.find((s) => s.id === id);
    if (!setting) throw new Error(`Setting not found: ${id}`);
    return setting;
  }
}

export const PgSettings = declareUpdatable(_PgSettings, {
  defaultState,
  recursive,
});
