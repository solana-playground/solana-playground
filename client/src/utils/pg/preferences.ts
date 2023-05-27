import { declareUpdateable, updateable } from "./decorators";

interface Preferences {
  /** Whether to show transaction details in terminal(only test UI) */
  showTxDetailsInTerminal: boolean;
}

const defaultState: Preferences = {
  showTxDetailsInTerminal: false,
};

const storage = {
  /** `localStorage` key */
  KEY: "preferences",

  /** Read from storage and deserialize the data. */
  read() {
    const stateStr = localStorage.getItem(this.KEY);
    if (!stateStr) return defaultState;
    return JSON.parse(stateStr) as Preferences;
  },

  /** Serialize the data and write to storage. */
  write(state: Preferences) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },
};

@updateable({ defaultState, storage })
class _PgPreferences {}

export const PgPreferences = declareUpdateable(_PgPreferences, {
  defaultState,
});
