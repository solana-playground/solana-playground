import * as vscode from "vscode";
import { Commitment } from "@solana/web3.js";

import { PgConnection } from "../../utils";

enum ConnectionCommand {
  ENDPOINT = "RPC Endpoint",
  COMMITMENT = "Commitment",
}

enum GetOrSet {
  GET = "Get",
  SET = "Set",
}

export const processConnection = async () => {
  const selection = await vscode.window.showQuickPick([
    ConnectionCommand.ENDPOINT,
    ConnectionCommand.COMMITMENT,
  ]);
  switch (selection) {
    case ConnectionCommand.ENDPOINT: {
      const selection = await vscode.window.showQuickPick([
        GetOrSet.GET,
        GetOrSet.SET,
      ]);

      if (selection === GetOrSet.GET) {
        const config = PgConnection.getConfig();
        vscode.window.showInformationMessage(config.endpoint);
      } else if (selection === GetOrSet.SET) {
        const networkName = await vscode.window.showQuickPick(
          PgConnection.NETWORKS.map((n) => n.name)
        );
        if (!networkName) return;

        const newEndpoint = PgConnection.NETWORKS.find(
          (n) => n.name === networkName
        )?.endpoint;
        if (newEndpoint) {
          PgConnection.setConfig({ endpoint: newEndpoint });
          vscode.window.showInformationMessage(
            `Set endpoint to: ${newEndpoint}`
          );
        }
      }

      break;
    }

    case ConnectionCommand.COMMITMENT: {
      const selection = await vscode.window.showQuickPick([
        GetOrSet.GET,
        GetOrSet.SET,
      ]);

      if (selection === GetOrSet.GET) {
        const config = PgConnection.getConfig();
        vscode.window.showInformationMessage(config.commitment);
      } else if (selection === GetOrSet.SET) {
        const newCommitment = (await vscode.window.showQuickPick(
          PgConnection.COMMITMENT_LEVELS
        )) as Commitment | undefined;

        if (!newCommitment) return;

        PgConnection.setConfig({ commitment: newCommitment });
        vscode.window.showInformationMessage(
          `Set commitment to: ${newCommitment}`
        );
      }

      break;
    }
  }
};
