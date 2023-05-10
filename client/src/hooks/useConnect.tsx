import { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { ConnState } from "../constants";
import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useConnect = () => {
  const isPgConnected = useRenderOnChange(PgWallet.onDidUpdateConnection);

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

  // Select wallet here(sol)
  useEffect(() => {
    if (!wallets.length) return;
    if (!wallet) select(wallets[0].adapter.name);
  }, [wallet, wallets, select]);

  // Both
  const connStatus = useMemo(() => {
    if (connected) return ConnState.CONNECTED;
    if (connecting) return ConnState.CONNECTING;
    if (isPgConnected) return ConnState.PG_CONNECTED;
    return ConnState.NOT_CONNECTED;
  }, [isPgConnected, connecting, connected]);

  // Sol
  const solButtonStatus = useMemo(() => {
    if (connected) return ConnState.DISCONNECT;
    if (connecting) return ConnState.CONNECTING;
    return ConnState.CONNECT;
  }, [connecting, connected]);

  // Pg
  const pgButtonStatus = useMemo(() => {
    if (isPgConnected) return ConnState.PG_DISCONNECT;
    return ConnState.PG_CONNECT;
  }, [isPgConnected]);

  // Sol
  const handleConnect = useCallback(async () => {
    try {
      if (!publicKey) await connect();
      else await disconnect();
    } catch (e: any) {
      console.log(e.message);
    }
  }, [publicKey, connect, disconnect]);

  return {
    connStatus,
    solButtonStatus,
    pgButtonStatus,
    pgConnected: PgWallet.isConnected,
    handleConnect,
    connecting,
    disconnecting,
  };
};
