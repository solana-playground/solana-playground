import { declareUpdatable, migratable, updatable } from "./decorators";

interface Settings {
  /** Test UI related settings */
  testUi: {
    /** Whether to show transaction details in terminal */
    showTxDetailsInTerminal: boolean;
  };
}

const defaultState: Settings = {
  testUi: {
    showTxDetailsInTerminal: false,
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
  const OLD_KEY = "preferences";

  const valueStr = localStorage.getItem(OLD_KEY);
  if (!valueStr) return;

  // Remove the old key
  localStorage.removeItem(OLD_KEY);

  // Migrate the old layout to the new layout
  interface OldSettings {
    showTxDetailsInTerminal: boolean;
  }

  const oldValue: OldSettings = JSON.parse(valueStr);
  const newValue: Settings = {
    testUi: {
      showTxDetailsInTerminal: oldValue.showTxDetailsInTerminal,
    },
  };

  localStorage.setItem(storage.KEY, JSON.stringify(newValue));
};

@migratable(migrate)
@updatable({ defaultState, storage, recursive })
class _PgSettings {}

export const PgSettings = declareUpdatable(_PgSettings, {
  defaultState,
  recursive,
});
