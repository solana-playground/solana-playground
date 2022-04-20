enum NetworkNames {
  LOCALHOST = "localhost",
  DEVNET = "devnet",
  TESTNET = "testnet",
  MAINNET_BETA = "mainnet-beta",
}

export enum Endpoints {
  LOCALHOST = "http://localhost:8899",
  DEVNET = "https://api.devnet.solana.com",
  TESTNET = "https://api.testnet.solana.com",
  MAINNET_BETA = "https://api.mainnet-beta.solana.com",
}

interface Network {
  name: NetworkNames;
  endpoint: Endpoints;
}

export const NETWORKS: Network[] = [
  {
    name: NetworkNames.LOCALHOST,
    endpoint: Endpoints.LOCALHOST,
  },
  {
    name: NetworkNames.DEVNET,
    endpoint: Endpoints.DEVNET,
  },
  {
    name: NetworkNames.TESTNET,
    endpoint: Endpoints.TESTNET,
  },
  {
    name: NetworkNames.MAINNET_BETA,
    endpoint: Endpoints.MAINNET_BETA,
  },
];
