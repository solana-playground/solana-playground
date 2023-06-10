import { useCallback, useEffect, useMemo } from "react";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

import { WalletState } from "../constants";
import { useWallet } from "./useWallet";

/** Connect to a Solana Wallet. */
export const useConnect = () => {
  const isPgConnected = useWallet().wallet?.isPg;

  // Other
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
  } = useSolanaWallet();

  // Select wallet (Other)
  useEffect(() => {
    if (!wallets.length) return;
    if (!wallet) select(wallets[0].adapter.name);
  }, [wallet, wallets, select]);

  // Both
  const connectionState = useMemo(() => {
    if (connected) return WalletState.CONNECTED;
    if (connecting) return WalletState.CONNECTING;
    if (isPgConnected) return WalletState.PG_CONNECTED;
    return WalletState.NOT_CONNECTED;
  }, [isPgConnected, connecting, connected]);

  // Other
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

  // Other
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
    connectionState,
    solButtonStatus,
    pgButtonStatus,
    pgConnected: isPgConnected,
    handleConnect,
    connecting,
    disconnecting,
  };
};
