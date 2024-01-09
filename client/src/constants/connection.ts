/** Name that will be showed in the UI */
export enum NetworkName {
  PLAYNET = "playnet",
  LOCALHOST = "localhost",
  DEVNET = "devnet",
  DEVNET_GENESYSGO = "devnet-genesysgo",
  DEVNET_ALCHEMY = "devnet-alchemy",
  TESTNET = "testnet",
  MAINNET_BETA = "mainnet-beta",
  CUSTOM = "custom",
}

/** RPC endpoint */
export enum Endpoint {
  PLAYNET = "http://playnet",
  LOCALHOST = "http://localhost:8899",
  DEVNET = "https://api.devnet.solana.com",
  DEVNET_GENESYSGO = "https://devnet.genesysgo.net/",
  DEVNET_ALCHEMY = "https://solana-devnet.g.alchemy.com/v2/demo",
  TESTNET = "https://api.testnet.solana.com",
  MAINNET_BETA = "https://api.mainnet-beta.solana.com",
  CUSTOM = "CUSTOM",
}

interface Network {
  name: NetworkName;
  endpoint: Endpoint;
}

/** Default networks that users can choose from */
export const NETWORKS: Network[] = [
  {
    name: NetworkName.PLAYNET,
    endpoint: Endpoint.PLAYNET,
  },
  {
    name: NetworkName.LOCALHOST,
    endpoint: Endpoint.LOCALHOST,
  },
  {
    name: NetworkName.DEVNET,
    endpoint: Endpoint.DEVNET,
  },
  {
    name: NetworkName.DEVNET_GENESYSGO,
    endpoint: Endpoint.DEVNET_GENESYSGO,
  },
  {
    name: NetworkName.DEVNET_ALCHEMY,
    endpoint: Endpoint.DEVNET_ALCHEMY,
  },
  {
    name: NetworkName.TESTNET,
    endpoint: Endpoint.TESTNET,
  },
  {
    name: NetworkName.MAINNET_BETA,
    endpoint: Endpoint.MAINNET_BETA,
  },
  {
    name: NetworkName.CUSTOM,
    endpoint: Endpoint.CUSTOM,
  },
];

/** Available commitment levels that users can choose from */
export const COMMITMENT_LEVELS = [
  "processed",
  "confirmed",
  "finalized",
] as const;
