import { atom } from "jotai";

const _terminalAtom = atom("");
export const terminalAtom = atom(
  (get) => get(_terminalAtom),
  (get, set, newVal: string) => {
    const terminal = get(_terminalAtom);
    if (!terminal) set(_terminalAtom, newVal);
    else set(_terminalAtom, terminal + "\n\n" + newVal);
  }
);
