import { Dispatch, SetStateAction, useEffect } from "react";
import { Atom, useAtom } from "jotai";
import { Connection } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

import { connectionAtom } from "../state";

/**
 * Get access to Playnet compatible globally synced `Connection` object.
 */
export const usePgConnection = () => {
  const [connection] = useAtom(connectionAtom as Atom<Connection>);

  return { connection };
};

/**
 * Overrides connection object to make it compatible with Playnet when necessary.
 *
 * IMPORTANT: This hook should only be used once in the app.
 */
export const usePgConnectionStatic = () => {
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
