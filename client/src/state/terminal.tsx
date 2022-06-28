import { atom } from "jotai";

// Terminal output
const _terminalOutputAtom = atom("");
export const terminalOutputAtom = atom(
  (get) => get(_terminalOutputAtom),
  (get, set, newVal: string) => {
    const terminal = get(_terminalOutputAtom);
    if (terminal !== newVal) set(_terminalOutputAtom, newVal);
    // To force-re render even if it's the exact same string
    else set(_terminalOutputAtom, newVal + "\t");
  }
);

export const terminalProgressAtom = atom(0);

interface TerminalState {
  // Build
  buildMounted: boolean;
  buildStart: boolean;
  // Deploy
  deployMounted: boolean;
  deployStart: boolean;
}

const _terminalStateAtom = atom<TerminalState>({
  buildMounted: false,
  buildStart: false,
  deployMounted: false,
  deployStart: false,
});

export enum TerminalAction {
  // Build
  buildMounted = 1,
  buildUnmounted = 2,
  buildStart = 3,
  buildStop = 4,
  // Deploy
  deployMounted = 5,
  deployUnmounted = 6,
  deployStart = 7,
  deployStop = 8,
}

export const terminalStateAtom = atom(
  (get) => get(_terminalStateAtom),
  (get, set, action: TerminalAction) => {
    const ts = get(_terminalStateAtom);
    if (action === TerminalAction.buildMounted)
      set(_terminalStateAtom, { ...ts, buildMounted: true });
    else if (action === TerminalAction.buildUnmounted)
      set(_terminalStateAtom, { ...ts, buildMounted: false });
    else if (action === TerminalAction.buildStart)
      set(_terminalStateAtom, { ...ts, buildStart: true });
    else if (action === TerminalAction.buildStop)
      set(_terminalStateAtom, { ...ts, buildStart: false });
    else if (action === TerminalAction.deployMounted)
      set(_terminalStateAtom, { ...ts, deployMounted: true });
    else if (action === TerminalAction.deployUnmounted)
      set(_terminalStateAtom, { ...ts, deployMounted: false });
    else if (action === TerminalAction.deployStart)
      set(_terminalStateAtom, { ...ts, deployStart: true });
    else if (action === TerminalAction.deployStop)
      set(_terminalStateAtom, { ...ts, deployStart: false });
  }
);
