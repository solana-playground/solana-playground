enum NetworkNames {
  LOCALHOST = "localhost",
  DEVNET = "devnet",
  DEVNET_GENESYSGO = "devnet-genesysgo",
  TESTNET = "testnet",
  MAINNET_BETA = "mainnet-beta",
  MAINNET_BETA_GENESYSGO = "mainnet-beta-genesysgo",
  MAINNET_BETA_SERUM = "mainnet-beta-serum",
}

export enum Endpoints {
  LOCALHOST = "http://localhost:8899",
  DEVNET = "https://api.devnet.solana.com",
  DEVNET_GENESYSGO = "https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899",
  TESTNET = "https://api.testnet.solana.com",
  MAINNET_BETA = "https://api.mainnet-beta.solana.com",
  MAINNET_BETA_GENESYSGO = "https://ssc-dao.genesysgo.net",
  MAINNET_BETA_SERUM = "https://solana-api.projectserum.com",
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
    name: NetworkNames.DEVNET_GENESYSGO,
    endpoint: Endpoints.DEVNET_GENESYSGO,
  },
  {
    name: NetworkNames.TESTNET,
    endpoint: Endpoints.TESTNET,
  },
  {
    name: NetworkNames.MAINNET_BETA,
    endpoint: Endpoints.MAINNET_BETA,
  },
  {
    name: NetworkNames.MAINNET_BETA_GENESYSGO,
    endpoint: Endpoints.MAINNET_BETA_GENESYSGO,
  },
  {
    name: NetworkNames.MAINNET_BETA_SERUM,
    endpoint: Endpoints.MAINNET_BETA_SERUM,
  },
];
