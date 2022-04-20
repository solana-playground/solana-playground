import { atom } from "jotai";

import { Explorer } from "../utils/pg/explorer";

export const explorerAtom = atom(new Explorer());
// To refresh explorer
const _explorerCountAtom = atom(0);
export const refreshExplorerAtom = atom(
  (get) => get(_explorerCountAtom),
  (get, set) => set(_explorerCountAtom, get(_explorerCountAtom) + 1)
);

// Adding file / folder
export const newItemAtom = atom<Element | null>(null);

// To decide whether the new item request is coming from context menu or buttons
export const ctxSelectedAtom = atom<Element | null>(null);
