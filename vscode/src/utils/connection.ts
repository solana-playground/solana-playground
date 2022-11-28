import { Commitment, Connection } from "@solana/web3.js";

import { PgStorage } from "./storage";
import { PgTerminal } from "./terminal";

interface ConnectionConfig {
  endpoint: Endpoint | string;
  commitment: Commitment;
  preflightChecks: boolean;
}

interface Network {
  name: NetworkName;
  endpoint: Endpoint;
}

enum NetworkName {
  LOCALHOST = "localhost",
  DEVNET = "devnet",
  DEVNET_GENESYSGO = "devnet-genesysgo",
  DEVNET_ALCHEMY = "devnet-alchemy",
  TESTNET = "testnet",
  MAINNET_BETA = "mainnet-beta",
  MAINNET_BETA_GENESYSGO = "mainnet-beta-genesysgo",
  MAINNET_BETA_SERUM = "mainnet-beta-serum",
  CUSTOM = "custom",
}

enum Endpoint {
  LOCALHOST = "http://localhost:8899",
  DEVNET = "https://api.devnet.solana.com",
  DEVNET_GENESYSGO = "https://devnet.genesysgo.net/",
  DEVNET_ALCHEMY = "https://solana-devnet.g.alchemy.com/v2/demo",
  TESTNET = "https://api.testnet.solana.com",
  MAINNET_BETA = "https://api.mainnet-beta.solana.com",
  MAINNET_BETA_GENESYSGO = "https://ssc-dao.genesysgo.net",
  MAINNET_BETA_SERUM = "https://solana-api.projectserum.com",
}

export class PgConnection {
  static NETWORKS: Network[] = [
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
      name: NetworkName.MAINNET_BETA_GENESYSGO,
      endpoint: Endpoint.MAINNET_BETA_GENESYSGO,
    },
    {
      name: NetworkName.MAINNET_BETA_SERUM,
      endpoint: Endpoint.MAINNET_BETA_SERUM,
    },
  ];

  static COMMITMENT_LEVELS: Commitment[] = [
    "processed",
    "confirmed",
    "finalized",
  ];

  static getConfig() {
    let configStr = PgStorage.getItem(this._KEY);
    if (!configStr) {
      const config: ConnectionConfig = {
        endpoint: Endpoint.DEVNET,
        commitment: "confirmed",
        preflightChecks: true,
      };

      configStr = JSON.stringify(config);

      PgStorage.setItem(this._KEY, configStr);
    }

    const config = JSON.parse(configStr) as ConnectionConfig;

    // Check whether `solana config get json_rpc_url` exists
    if (PgTerminal.cmdExists("solana --version")) {
      config.endpoint = PgTerminal.exec("solana config get json_rpc_url")
        .stdout.substring(9)
        .trim();
      config.commitment = PgTerminal.exec("solana config get commitment")
        .stdout.substring(12)
        .trim() as Commitment;
    }

    return config;
  }

  static setConfig(value: Partial<ConnectionConfig>) {
    PgStorage.setItem(
      this._KEY,
      JSON.stringify({ ...this.getConfig(), value })
    );

    // Change solana config if it exists
    if (PgTerminal.cmdExists("solana --version")) {
      if (value.commitment) {
        PgTerminal.exec(`solana config set --commitment ${value.commitment}`);
      }
      if (value.endpoint) {
        PgTerminal.exec(`solana config set -u ${value.endpoint}`);
      }
    }
  }

  static get endpoint() {
    return this.getConfig().endpoint;
  }

  static get preflightChecks() {
    return this.getConfig().preflightChecks;
  }

  static get() {
    const config = this.getConfig();
    return new Connection(config.endpoint, { commitment: config.commitment });
  }

  /**
   * @returns airdrop amount based on endpoint
   */
  static getAirdropAmount(endpoint: Endpoint | string = PgConnection.endpoint) {
    switch (endpoint) {
      case Endpoint.LOCALHOST:
        return 100;
      case Endpoint.DEVNET:
        return 2;
      case Endpoint.TESTNET:
        return 1;
      default:
        return null;
    }
  }

  private static readonly _KEY = "connection";
}
