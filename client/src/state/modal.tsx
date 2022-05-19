import { ReactElement } from "react";
import { atom } from "jotai";

export const modalAtom = atom<ReactElement | null>(null);
