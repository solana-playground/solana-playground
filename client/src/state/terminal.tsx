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
  buildMounted: boolean;
  runBuild: boolean;
}

const _terminalStateAtom = atom<TerminalState>({
  buildMounted: false,
  runBuild: false,
});

export enum TerminalAction {
  buildMounted = 1,
  buildUnmounted = 2,
  runBuild = 3,
  notRunBuild = 4,
}

export const terminalStateAtom = atom(
  (get) => get(_terminalStateAtom),
  (get, set, action: TerminalAction) => {
    const ts = get(_terminalStateAtom);
    if (action === TerminalAction.buildMounted)
      set(_terminalStateAtom, { ...ts, buildMounted: true });
    else if (action === TerminalAction.buildUnmounted)
      set(_terminalStateAtom, { ...ts, buildMounted: false });
    else if (action === TerminalAction.runBuild)
      set(_terminalStateAtom, { ...ts, runBuild: true });
    else if (action === TerminalAction.notRunBuild)
      set(_terminalStateAtom, { ...ts, runBuild: false });
  }
);
