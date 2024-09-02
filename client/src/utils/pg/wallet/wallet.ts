import * as ed25519 from "@noble/ed25519";

import { PgCommon } from "../common";
import {
  createDerivable,
  declareDerivable,
  declareUpdatable,
  derivable,
  migratable,
  updatable,
} from "../decorators";
import { PgWeb3 } from "../web3";
import type {
  AnyTransaction,
  CurrentWallet,
  SerializedWallet,
  StandardWallet,
  StandardWalletProps,
  Wallet,
  WalletAccount,
} from "./types";

const defaultState: Wallet = {
  state: "setup",
  accounts: [],
  currentIndex: -1,
  balance: null,
  show: false,
  standardWallets: [],
  standardName: null,
};

const storage = {
  /** Relative path to program info */
  KEY: "wallet",

  /** Read from storage and deserialize the data. */
  read(): Wallet {
    const serializedStateStr = localStorage.getItem(this.KEY);
    if (!serializedStateStr) return defaultState;

    const serializedState: SerializedWallet = JSON.parse(serializedStateStr);
    return {
      ...serializedState,
      balance: defaultState.balance,
      show: defaultState.show,
      standardWallets: defaultState.standardWallets,
    };
  },

  /** Serialize the data and write to storage. */
  write(wallet: Wallet) {
    // Don't use spread operator(...) because of the extra derived state
    const serializedState: SerializedWallet = {
      accounts: wallet.accounts,
      currentIndex: wallet.currentIndex,
      state: wallet.state,
      standardName: wallet.standardName,
    };

    localStorage.setItem(this.KEY, JSON.stringify(serializedState));
  },
};

const derive = () => ({
  /** A Wallet Standard wallet adapter */
  standard: createDerivable({
    derive: (): StandardWallet | null => {
      const otherWallet = PgWallet.standardWallets.find(
        (wallet) => wallet.adapter.name === PgWallet.standardName
      );
      return otherWallet?.adapter ?? null;
    },
    onChange: ["standardWallets", "standardName"],
  }),

  /**
   * The current active wallet.
   *
   * It will be one of the following:
   * - The Playground Wallet
   * - A Wallet Standard wallet
   * - `null` if not connected.
   */
  current: createDerivable({
    derive: async (): Promise<CurrentWallet | null> => {
      switch (PgWallet.state) {
        case "pg": {
          // Check whether the current account exists
          const currentAccount = PgWallet.accounts[PgWallet.currentIndex];
          if (!currentAccount) {
            if (!PgWallet.accounts.length) PgWallet.add();
            else PgWallet.switch(0);

            return null;
          }

          return PgWallet.createWallet(currentAccount);
        }

        case "sol":
          if (!PgWallet.standard || PgWallet.standard.connecting) return null;
          if (!PgWallet.standard.connected) await PgWallet.standard.connect();
          return PgWallet.standard as StandardWalletProps;

        case "disconnected":
        case "setup":
          return null;
      }
    },
    onChange: ["state", "accounts", "currentIndex", "standard"],
  }),
});

// TODO: Remove in 2024
const migrate = () => {
  const walletStr = localStorage.getItem(storage.KEY);
  if (!walletStr) return;

  interface OldWallet {
    setupCompleted: boolean;
    connected: boolean;
    sk: Array<number>;
  }

  const oldOrNewWallet: OldWallet | Wallet = JSON.parse(walletStr);
  if ((oldOrNewWallet as Wallet).accounts) return;

  const oldWallet = oldOrNewWallet as OldWallet;
  const newWallet: Wallet = {
    ...defaultState,
    state: oldWallet.setupCompleted
      ? oldWallet.connected
        ? "pg"
        : "disconnected"
      : "setup",
    accounts: [{ kp: oldWallet.sk, name: "Wallet 1" }],
  };

  // Set the new wallet format
  localStorage.setItem(storage.KEY, JSON.stringify(newWallet));

  // Remove wallet adapter key
  localStorage.removeItem("walletName");
};

@migratable(migrate)
@derivable(derive)
@updatable({ defaultState, storage })
class _PgWallet {
  /**
   * Add a new account.
   *
   * @param name name of the account
   * @param keypair optional keypair, default to a random keypair
   */
  static add(params?: { name?: string; keypair?: PgWeb3.Keypair }) {
    const { name, keypair } = PgCommon.setDefault(params, {
      name: PgWallet.getNextAvailableAccountName(),
      keypair: PgWeb3.Keypair.generate(),
    });

    // Validate name
    PgWallet.validateAccountName(name);

    // Check if account exists
    const accountIndex = PgWallet.accounts.findIndex((acc) => {
      return (
        (name && acc.name === name) ||
        keypair.publicKey.toBuffer().equals(Buffer.from(acc.kp))
      );
    });
    if (accountIndex !== -1) {
      // Account exists, switch to the account
      PgWallet.switch(accountIndex);
      return;
    }

    // Add the account
    PgWallet.accounts.push({
      kp: Array.from(keypair.secretKey),
      name,
    });

    // Update the accounts
    PgWallet.update({
      state: "pg",
      accounts: PgWallet.accounts,
      currentIndex: PgWallet.accounts.length - 1,
    });
  }

  /**
   * Remove the account at the given index.
   *
   * @param index account index
   */
  static remove(index: number = PgWallet.currentIndex) {
    PgWallet.accounts.splice(index, 1);

    // Update the accounts
    PgWallet.update({
      accounts: PgWallet.accounts,
      currentIndex: PgWallet.accounts.length - 1,
    });
  }

  /**
   * Rename the account.
   *
   * @param name new name of the account
   * @param index account index
   */
  static rename(name: string, index: number = PgWallet.currentIndex) {
    // Validate name
    PgWallet.validateAccountName(name);

    PgWallet.accounts[index].name = name;

    // Update the accounts
    PgWallet.update({ accounts: PgWallet.accounts });
  }

  /**
   * Import a keypair from the user's file system.
   *
   * @param name name of the account
   * @returns the imported keypair if importing was successful
   */
  static async import(name?: string) {
    return await PgCommon.import(
      async (ev) => {
        const files = ev.target.files;
        if (!files?.length) return;

        try {
          const file = files[0];
          const arrayBuffer = await file.arrayBuffer();
          const decodedString = PgCommon.decodeBytes(arrayBuffer);
          const keypairBytes = Uint8Array.from(JSON.parse(decodedString));
          if (keypairBytes.length !== 64) throw new Error("Invalid keypair");

          const keypair = PgWeb3.Keypair.fromSecretKey(keypairBytes);
          PgWallet.add({ name, keypair });

          return keypair;
        } catch (err: any) {
          console.log(err.message);
        }
      },
      { accept: ".json" }
    );
  }

  /**
   * Export the given or the existing keypair to the user's file system.
   *
   * @param keypair optional keypair, defaults to the current wallet's keypair
   */
  static export(keypair?: PgWeb3.Keypair) {
    PgCommon.export(
      "wallet-keypair.json",
      keypair ? Array.from(keypair.secretKey) : PgWallet.getKeypairBytes()
    );
  }

  /**
   * Switch to the given account index.
   *
   * @param index account index to switch to
   */
  static switch(index: number) {
    if (!PgWallet.accounts[index]) {
      throw new Error(`Account index '${index}' not found`);
    }

    PgWallet.update({
      state: "pg",
      currentIndex: index,
    });
  }

  /**
   * Get the default name of the wallet account.
   *
   * @param index account index
   * @returns the wallet account name
   */
  static getDefaultAccountName(index: number = PgWallet.currentIndex) {
    return `Wallet ${index + 1}`;
  }

  /**
   * Get the next available default account name.
   *
   * This method recurses until it founds an available wallet account name.
   *
   * @param index account index
   * @returns the next available default account name
   */
  static getNextAvailableAccountName(
    index: number = PgWallet.accounts.length
  ): string {
    try {
      const name = PgWallet.getDefaultAccountName(index);
      PgWallet.validateAccountName(name);
      return name;
    } catch {
      return PgWallet.getNextAvailableAccountName(index + 1);
    }
  }

  /** Get the keypair bytes of the current wallet. */
  static getKeypairBytes() {
    if (!PgWallet.current) throw new Error("Not connected");
    if (!PgWallet.current.isPg) throw new Error("Not Playground Wallet");

    return Array.from(PgWallet.current.keypair.secretKey);
  }

  /**
   * Get all of the connected standard wallet adapters.
   *
   * @returns the connected standard wallet adapters
   */
  static getConnectedStandardWallets() {
    return PgWallet.standardWallets
      .map((wallet) => wallet.adapter)
      .filter((adapter) => adapter.connected);
  }

  /**
   * Create a Playground Wallet instance from the given account.
   *
   * @param account wallet account to derive the instance from
   * @returns a Playground Wallet instance
   */
  static createWallet(account: WalletAccount): CurrentWallet {
    const keypair = PgWeb3.Keypair.fromSecretKey(Uint8Array.from(account.kp));

    return {
      isPg: true,
      keypair,
      name: account.name,
      publicKey: keypair.publicKey,

      async signTransaction<T extends AnyTransaction>(tx: T) {
        if ((tx as PgWeb3.VersionedTransaction).version) {
          (tx as PgWeb3.VersionedTransaction).sign([keypair]);
        } else {
          (tx as PgWeb3.Transaction).partialSign(keypair);
        }

        return tx;
      },

      async signAllTransactions<T extends AnyTransaction>(txs: T[]) {
        for (const tx of txs) {
          this.signTransaction(tx);
        }

        return txs;
      },

      async signMessage(message: Uint8Array) {
        return await ed25519.sign(message, keypair.secretKey.slice(0, 32));
      },
    };
  }

  /**
   * Check whether the given wallet account name is valid.
   *
   * @param name wallet account name
   * @throws if the name is not valid
   */
  static validateAccountName(name: string) {
    name = name.trim();

    // Empty check
    if (!name) throw new Error("Account name can't be empty");

    // Check whether the name exists
    const nameExists = PgWallet.accounts.some((acc) => acc.name === name);
    if (nameExists) throw new Error(`Account '${name}' already exists`);
  }
}

export const PgWallet = declareDerivable(
  declareUpdatable(_PgWallet, { defaultState }),
  derive
);
