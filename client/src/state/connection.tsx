import { atom } from "jotai";

// Wallet
export const showWalletAtom = atom(false);
export const uiBalanceAtom = atom<number | null>(null);
