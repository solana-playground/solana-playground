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
