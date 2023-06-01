import { Endpoint } from "../../constants";
import { declareUpdatable, migratable, updatable } from "./decorators";
import type { OrString } from "./types";

interface Settings {
  /** Connection settings */
  connection: {
    endpoint: OrString<Endpoint>;
    commitment: "processed" | "confirmed" | "finalized";
    preflightChecks: boolean;
  };
  /** Test UI settings */
  testUi: {
    /** Whether to show transaction details in terminal */
    showTxDetailsInTerminal: boolean;
  };
}

const defaultState: Settings = {
  connection: {
    endpoint: Endpoint.DEVNET,
    commitment: "confirmed",
    preflightChecks: true,
  },
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
    connection: oldConnectionConfig,
    testUi: {
      showTxDetailsInTerminal: oldSettings.showTxDetailsInTerminal,
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
