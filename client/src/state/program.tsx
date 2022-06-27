import { atom } from "jotai";
import { Buffer } from "buffer";

export interface Program {
  buffer: Buffer;
  fileName: string;
}

export const DEFAULT_PROGRAM: Program = {
  buffer: Buffer.from([]),
  fileName: "",
};

export const programAtom = atom<Program>(DEFAULT_PROGRAM);

const _programIdCountAtom = atom(0);
export const refreshProgramIdAtom = atom(
  (get) => get(_programIdCountAtom),
  (get, set) => set(_programIdCountAtom, get(_programIdCountAtom) + 1)
);
