/** RPC endpoint */
export enum Endpoint {
  PLAYNET = "http://playnet",
  LOCALNET = "http://localhost:8899",
  DEVNET = "https://api.devnet.solana.com",
  TESTNET = "https://api.testnet.solana.com",
  MAINNET_BETA = "https://api.mainnet-beta.solana.com",
}

interface Network {
  name: string;
  endpoint: Endpoint;
}

/** Default networks that users can choose from */
export const NETWORKS: Network[] = [
  {
    name: "Playnet",
    endpoint: Endpoint.PLAYNET,
  },
  {
    name: "Localnet",
    endpoint: Endpoint.LOCALNET,
  },
  {
    name: "Devnet",
    endpoint: Endpoint.DEVNET,
  },
  {
    name: "Testnet",
    endpoint: Endpoint.TESTNET,
  },
  {
    name: "Mainnet Beta",
    endpoint: Endpoint.MAINNET_BETA,
  },
];
