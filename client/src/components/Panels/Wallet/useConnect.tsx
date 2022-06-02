import { useCallback, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { useWallet } from "@solana/wallet-adapter-react";

import Setup from "./Setup";
import { ConnState } from "./connection-states";
import { modalAtom, pgWalletAtom, refreshPgWalletAtom } from "../../../state";
import { PgWallet } from "../../../utils/pg";

const useConnect = () => {
  // Pg
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged, refresh] = useAtom(refreshPgWalletAtom);
  const [, setModal] = useAtom(modalAtom);

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
    if (pgWallet.connected) return ConnState.PG_CONNECTED;

    return ConnState.NOT_CONNECTED;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgWalletChanged, connecting, connected]);

  // Sol
  const solButtonStatus = useMemo(() => {
    if (connected) return ConnState.DISCONNECT;
    if (connecting) return ConnState.CONNECTING;

    return ConnState.CONNECT;
  }, [connecting, connected]);

  // Pg
  const pgButtonStatus = useMemo(() => {
    if (pgWallet.connected) return ConnState.PG_DISCONNECT;

    return ConnState.PG_CONNECT;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgWalletChanged]);

  // Sol
  const handleConnect = useCallback(() => {
    try {
      if (!publicKey) connect();
      else disconnect();
    } catch (e: any) {
      console.log(e.message);
    }
  }, [publicKey, connect, disconnect]);

  // Pg wallet should always be connected except first time ever
  const handleConnectPg = useCallback(() => {
    const setupCompleted = PgWallet.getLs()?.setupCompleted;
    if (!setupCompleted) setModal(<Setup onSubmit={handleConnectPg} />);
    else {
      pgWallet.connected = !pgWallet.connected;
      PgWallet.update({ connected: pgWallet.connected });
      refresh();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgWalletChanged]);

  return {
    connStatus,
    solButtonStatus,
    pgButtonStatus,
    pgConnected: pgWallet.connected,
    handleConnect,
    handleConnectPg,
    connecting,
    disconnecting,
  };
};

export default useConnect;
