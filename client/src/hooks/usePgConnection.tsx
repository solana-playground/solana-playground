import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

import { EventName } from "../constants";
import { useSetStatic } from "./useSetStatic";

/**
 * Overrides connection object to make it compatible with Playnet
 * when necessary.
 */
export const usePgConnection = () => {
  const { connection } = useConnection();

  const [newConnection, setNewConnection] = useState(connection);
  useSetStatic(setNewConnection, EventName.CONNECTION_SET);

  // Sync new connection when connection updates
  useEffect(() => setNewConnection(connection), [connection]);

  return { connection: newConnection };
};
