import { atom } from "jotai";

interface MenuState {
  show: boolean;
  position: Position;
}

export interface Position {
  x: number;
  y: number;
}

export const contextMenuStateAtom = atom<MenuState>({
  show: false,
  position: { x: 0, y: 0 },
});
