import { atom } from "jotai";

// Adding file / folder
export const newItemAtom = atom<Element | null>(null);

// To decide whether the new item request is coming from context menu or buttons
export const ctxSelectedAtom = atom<Element | null>(null);
