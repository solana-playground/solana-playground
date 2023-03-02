import { Connection } from "@solana/web3.js";
import { atom } from "jotai";

import { PgConnection, PgWallet, PgConnectionConfig } from "../utils/pg";

// Wallet
export const pgWalletAtom = atom(new PgWallet());
export const showWalletAtom = atom(false);
export const uiBalanceAtom = atom<number | null>(null);

// To trigger re-render
const _countAtom = atom(0);
export const refreshPgWalletAtom = atom(
  (get) => get(_countAtom),
  (get, set) => {
    set(_countAtom, get(_countAtom) + 1);
  }
);

// Connection config
export const connectionConfigAtom = atom<PgConnectionConfig>(
  PgConnection.getConnectionConfig()
);

// Connection
export const connectionAtom = atom<Connection | null>(null);
