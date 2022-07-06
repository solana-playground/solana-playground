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
  buildLoading: boolean;
  // Deploy
  deployMounted: boolean;
  deployStart: boolean;
  deployLoading: boolean;
  // Wallet
  walletConnectOrSetup: boolean;
}

const _terminalStateAtom = atom<TerminalState>({
  buildMounted: false,
  buildStart: false,
  buildLoading: false,
  deployMounted: false,
  deployStart: false,
  deployLoading: false,
  walletConnectOrSetup: false,
});

export enum TerminalAction {
  // Build
  buildMount = 1,
  buildUnmount = 2,
  buildStart = 3,
  buildStop = 4,
  buildLoadingStart = 5,
  buildLoadingStop = 6,
  // Deploy
  deployMount = 7,
  deployUnmount = 8,
  deployStart = 9,
  deployStop = 10,
  deployLoadingStart = 11,
  deployLoadingStop = 12,
  // Wallet
  walletConnectOrSetupStart = 13,
  walletConnectOrSetupStop = 14,
}

export const terminalStateAtom = atom(
  (get) => get(_terminalStateAtom),
  (get, set, actions: TerminalAction | TerminalAction[]) => {
    if (typeof actions !== "object") actions = [actions];

    let ts = get(_terminalStateAtom);

    // Build
    if (actions.includes(TerminalAction.buildMount)) ts.buildMounted = true;
    if (actions.includes(TerminalAction.buildUnmount)) ts.buildMounted = false;
    if (actions.includes(TerminalAction.buildStart)) ts.buildStart = true;
    if (actions.includes(TerminalAction.buildStop)) ts.buildStart = false;
    if (actions.includes(TerminalAction.buildLoadingStart))
      ts.buildLoading = true;
    if (actions.includes(TerminalAction.buildLoadingStop))
      ts.buildLoading = false;

    // Deploy
    if (actions.includes(TerminalAction.deployMount)) ts.deployMounted = true;
    if (actions.includes(TerminalAction.deployUnmount))
      ts.deployMounted = false;
    if (actions.includes(TerminalAction.deployStart)) ts.deployStart = true;
    if (actions.includes(TerminalAction.deployStop)) ts.deployStart = false;
    if (actions.includes(TerminalAction.deployLoadingStart))
      ts.deployLoading = true;
    if (actions.includes(TerminalAction.deployLoadingStop))
      ts.deployLoading = false;
    if (actions.includes(TerminalAction.walletConnectOrSetupStart))
      ts.walletConnectOrSetup = true;
    if (actions.includes(TerminalAction.walletConnectOrSetupStop))
      ts.walletConnectOrSetup = false;

    // Recreate the object to re-render
    set(_terminalStateAtom, { ...ts });
  }
);
