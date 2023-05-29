import { useConnection } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { useAtom } from "jotai";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../constants";
import {
  useAsyncEffect,
  useCurrentWallet,
  useDisposable,
  useExposeStatic,
  useGetAndSetStatic,
  useGetStatic,
  useSetStatic,
} from "../../hooks";
import {
  uiBalanceAtom,
  explorerAtom,
  terminalProgressAtom,
  tutorialAtom,
  connectionAtom,
} from "../../state";
import {
  PgCommon,
  Disposable,
  PgExplorer,
  PgPreferences,
  PgProgramInfo,
  PgWallet,
} from "../../utils/pg";

const GlobalState = () => {
  // Balance
  const [, setBalance] = useAtom(uiBalanceAtom);
  useSetStatic(setBalance, EventName.WALLET_UI_BALANCE_SET);

  // Connection
  const [connection, setConnection] = usePgConnectionStatic();
  useGetAndSetStatic(connection, setConnection, EventName.CONNECTION_STATIC);

  // Explorer
  const [explorer] = useAtom(explorerAtom);
  useExposeStatic(explorer, EventName.EXPLORER_STATIC);

  // Preferences
  useDisposable(PgPreferences.init);

  // Router location
  const location = useLocation();
  useGetStatic(location, EventName.ROUTER_LOCATION);

  // Router navigate
  const navigate = useNavigate();
  useSetStatic(navigate, EventName.ROUTER_NAVIGATE);

  // Terminal progress
  const [, setProgress] = useAtom(terminalProgressAtom);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);

  // Tutorial
  const [tutorial, setTutorial] = useAtom(tutorialAtom);
  useGetAndSetStatic(tutorial, setTutorial, EventName.TUTORIAL_STATIC);

  // Wallet
  useWalletStatic();

  // Program info
  useProgramInfoStatic();

  return null;
};

/**
 * Override connection object to make it compatible with Playnet when necessary.
 *
 * **IMPORTANT**: Should only be used once.
 */
const usePgConnectionStatic = () => {
  const [connection, setConnection] = useAtom(connectionAtom);

  const { connection: defaultConnection } = useConnection();

  // Sync new connection when connection updates
  useEffect(() => {
    setConnection(defaultConnection);
  }, [defaultConnection, setConnection]);

  return [connection, setConnection] as [
    Connection,
    Dispatch<SetStateAction<Connection>>
  ];
};

/**
 * Responsible for initializing `PgWallet` and dispatching events on wallet public
 * key change. Note that this applies to all wallets, not just Playground wallet.
 *
 * **IMPORTANT**: Should only be used once.
 */
const useWalletStatic = () => {
  // Initialize the wallet
  useEffect(() => {
    PgWallet.init();
  }, []);

  const { wallet, walletPkStr, pgWallet } = useCurrentWallet();

  // Handle change event
  useEffect(() => {
    if (!walletPkStr || !pgWallet?.isConnected) return;
    PgCommon.createAndDispatchCustomEvent(
      EventName.WALLET_ON_DID_CHANGE_CURRENT_WALLET,
      wallet
    );
  }, [walletPkStr, pgWallet?.isConnected, wallet]);
};

/**
 * Initialize `PgProgramInfo` each time the current workspace changes.
 *
 * **IMPORTANT**: Should only be used once.
 */
const useProgramInfoStatic = () => {
  useAsyncEffect(async () => {
    const explorer = await PgExplorer.get();
    let disposeProgramInfo: Disposable | undefined;
    const { dispose } = explorer.onDidChangeWorkspace(async () => {
      disposeProgramInfo?.dispose();
      disposeProgramInfo = await PgProgramInfo.init();
    });

    return () => dispose();
  }, []);
};

export default GlobalState;
