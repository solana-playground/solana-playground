import { atom } from "jotai";

export const terminalProgressAtom = atom(0);

interface TerminalState {
  // Build
  buildLoading: boolean;
  // Deploy
  deployLoading: boolean;
}

const _terminalStateAtom = atom<TerminalState>({
  buildLoading: false,
  deployLoading: false,
});

export enum TerminalAction {
  // Build
  buildLoadingStart = 3,
  buildLoadingStop = 4,
  // Deploy
  deployLoadingStart = 7,
  deployLoadingStop = 8,
}

export const terminalStateAtom = atom(
  (get) => get(_terminalStateAtom),
  (get, set, actions: TerminalAction | TerminalAction[]) => {
    if (!Array.isArray(actions)) actions = [actions];

    let ts = get(_terminalStateAtom);

    // Build
    if (actions.includes(TerminalAction.buildLoadingStart))
      ts.buildLoading = true;
    if (actions.includes(TerminalAction.buildLoadingStop))
      ts.buildLoading = false;

    // Deploy
    if (actions.includes(TerminalAction.deployLoadingStart))
      ts.deployLoading = true;
    if (actions.includes(TerminalAction.deployLoadingStop))
      ts.deployLoading = false;

    // Recreate the object to re-render
    set(_terminalStateAtom, { ...ts });
  }
);
