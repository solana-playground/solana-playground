import { Cluster } from "@solana/web3.js";

import { PgConnection } from "../../../connection";

// Hash for devnet cluster
const DEVNET_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

// Hash for mainnet-beta cluster
const MAINNET_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

/**
 * Get the current cluster based on given rpc endpoint(only devnet and mainnet)
 *
 * @param rpcUrl endpoint
 * @returns current cluster
 */
export async function getCluster(rpcUrl: string): Promise<Cluster | null> {
  const conn = PgConnection.createConnectionFromUrl(rpcUrl);
  const genesisHash = await conn.getGenesisHash();
  switch (genesisHash) {
    case DEVNET_HASH:
      return "devnet";
    case MAINNET_HASH:
      return "mainnet-beta";
    default:
      return null;
  }
}
