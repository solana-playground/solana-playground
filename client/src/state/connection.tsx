import { Connection } from "@solana/web3.js";
import { atom } from "jotai";

// Wallet
export const showWalletAtom = atom(false);
export const uiBalanceAtom = atom<number | null>(null);

// Connection
export const connectionAtom = atom<Connection | null>(null);
