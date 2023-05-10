import { Atom, useAtom } from "jotai";
import { Connection } from "@solana/web3.js";

import { connectionAtom } from "../state";

/**
 * Get access to Playnet compatible globally synced `Connection` object.
 */
export const usePgConnection = () => {
  const [connection] = useAtom(connectionAtom as Atom<Connection>);

  return { connection };
};
