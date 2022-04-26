import { atom } from "jotai";

const _terminalAtom = atom("");
export const terminalAtom = atom(
  (get) => get(_terminalAtom),
  (get, set, newVal: string) => {
    const terminal = get(_terminalAtom);
    if (terminal !== newVal) set(_terminalAtom, newVal);
    // To force-re render even if it's the exact same string
    else set(_terminalAtom, newVal + "\t");
  }
);

export const terminalProgressAtom = atom(0);
