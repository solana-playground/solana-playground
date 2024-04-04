// Settings are getting loaded at the start of the application, so any non-type
// import should be avoided.

import { Endpoint } from "../../constants";
import { declareUpdatable, migratable, updatable } from "./decorators";
import type { OrString } from "./types";

interface Settings {
  /** Connection settings */
  connection: {
    /** Connection RPC URL */
    endpoint: OrString<Endpoint>;
    /** Connection commitment */
    commitment: "processed" | "confirmed" | "finalized";
    /** Whether to enable preflight checks */
    preflightChecks: boolean;
    /** Priority fee calculcation method, or `number` for custom */
    priorityFee: "average" | "median" | "min" | "max" | number;
  };
  /** Build settings */
  // TODO: Re-evalute whether build settings should be stored in `PgProgramInfo`
  // to allow the ability to set program specific settings instead of global?
  build: {
    flags: {
      /** Whether to enable Anchor `seeds` feature */
      seedsFeature: boolean;
      /** Whether to remove docs from the Anchor IDL */
      noDocs: boolean;
      /** Whether to enable Anchor safety checks */
      safetyChecks: boolean;
    };
    /** Whether to improve build error logs */
    improveErrors: boolean;
  };
  /** Test UI settings */
  testUi: {
    /** Whether to show transaction details in terminal */
    showTxDetailsInTerminal: boolean;
  };
  /** Notification settings */
  notification: {
    /** Whether to show transaction toast notification */
    showTx: boolean;
  };
  /** Other settings */
  other: {
    /** Default block explorer */
    blockExplorer: "Solana Explorer" | "Solscan" | "Solana FM";
  };
  /** Wallet settings */
  wallet: {
    /** Whether to airdrop automatically */
    automaticAirdrop: boolean;
  };
}

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
class _PgSettings {}

export const PgSettings = declareUpdatable(_PgSettings, {
  defaultState,
  recursive,
});
