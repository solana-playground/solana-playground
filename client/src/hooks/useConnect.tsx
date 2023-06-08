import { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { WalletState } from "../constants";
import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useConnect = () => {
  const isPgConnected = useRenderOnChange(PgWallet.onDidChangeCurrent)?.isPg;

  // Sol
  const {
    wallet,
    publicKey,
    wallets,
    select,
    connect,
    connected,
    connecting,
    disconnect,
    disconnecting,
  } = useWallet();

  // Select wallet (Sol)
  useEffect(() => {
    if (!wallets.length) return;
    if (!wallet) select(wallets[0].adapter.name);
  }, [wallet, wallets, select]);

  // Both
  const connState = useMemo(() => {
    if (connected) return WalletState.CONNECTED;
    if (connecting) return WalletState.CONNECTING;
    if (isPgConnected) return WalletState.PG_CONNECTED;
    return WalletState.NOT_CONNECTED;
  }, [isPgConnected, connecting, connected]);

  // Sol
  const solButtonStatus = useMemo(() => {
    if (connected) return WalletState.DISCONNECT;
    if (connecting) return WalletState.CONNECTING;
    return WalletState.CONNECT;
  }, [connecting, connected]);

  // Pg
  const pgButtonStatus = useMemo(() => {
    if (isPgConnected) return WalletState.PG_DISCONNECT;
    return WalletState.PG_CONNECT;
  }, [isPgConnected]);

  // Sol
  const handleConnect = useCallback(async () => {
    if (connecting || disconnecting) return;

    try {
      if (!publicKey) await connect();
      else await disconnect();
    } catch (e: any) {
      console.log("Couldn't connect/disconnect", e.message);
    }
  }, [publicKey, connecting, disconnecting, connect, disconnect]);

  return {
    connState,
    solButtonStatus,
    pgButtonStatus,
    pgConnected: PgWallet.isConnected,
    handleConnect,
    connecting,
    disconnecting,
  };
};
