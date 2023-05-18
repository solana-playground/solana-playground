import { declareUpdateable, updateable } from "./decorators";

interface Preferences {
  /** Whether to show transaction details in terminal(only test UI) */
  showTxDetailsInTerminal: boolean;
}

@updateable<Preferences>({ showTxDetailsInTerminal: false })
class _PgPreferences {
  /** Manage storage, used inside `@updateable` */
  private static _storage = class {
    /** Read from storage and deserialize the data. */
    static read() {
      const stateStr = localStorage.getItem(this._KEY);
      if (!stateStr) return PgPreferences.DEFAULT;

      // Deserialize
      const deserializedState = JSON.parse(stateStr) as Preferences;
      return deserializedState;
    }

    /** Serialize the data and write to storage. */
    static write(state: Preferences) {
      // Serialize
      const serializedState = JSON.stringify(state);
      localStorage.setItem(this._KEY, serializedState);
    }

    /** `localStorage` key */
    private static readonly _KEY = "preferences";
  };
}

export const PgPreferences = declareUpdateable(
  _PgPreferences,
  {} as Preferences
);
