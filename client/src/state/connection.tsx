import { Connection } from "@solana/web3.js";
import { atom } from "jotai";

import { PgConnection, PgConnectionConfig } from "../utils/pg";

// Wallet
export const showWalletAtom = atom(false);
export const uiBalanceAtom = atom<number | null>(null);

// Connection config
export const connectionConfigAtom = atom<PgConnectionConfig>(
  PgConnection.getConnectionConfig()
);

// Connection
export const connectionAtom = atom<Connection | null>(null);
