import type { Cluster } from "@solana/web3.js";

import { PgConnection } from "../../../../connection";
import { PgSettings } from "../../../../settings";

/** Genesis hash for devnet cluster */
const DEVNET_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/** Genesis for mainnet-beta cluster */
const MAINNET_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

/**
 * Get the current cluster based on given rpc endpoint(only devnet and mainnet)
 *
 * @param rpcUrl endpoint
 * @returns current cluster
 */
export async function getCluster(
  rpcUrl: string = PgSettings.connection.endpoint
): Promise<Cluster | null> {
  const conn = PgConnection.create({ endpoint: rpcUrl });
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
