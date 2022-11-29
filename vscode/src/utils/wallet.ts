import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as TOML from "@iarna/toml";
import { Keypair } from "@solana/web3.js";

import { Framework, PgFs } from "./fs";
import { PgTerminal } from "./terminal";
import { PATHS } from "../constants";

export class PgWallet {
  static readonly DEFAULT_KEYPAIR_PATH: string = path.join(
    os.homedir(),
    ".config",
    "solana",
    "id.json"
  );

  static async getPublicKey() {
    return (await this.getKeypair()).publicKey;
  }

  static async getKeypair() {
    const keypairBytes = await this._getOrCreateKeypairBytes();
    return Keypair.fromSecretKey(keypairBytes);
  }

  private static async _getOrCreateKeypairBytes() {
    const keypair = await this._getKeypair();
    if (!keypair) {
      return await this._createKeypair();
    }

    return keypair;
  }

  private static async _getKeypair() {
    let keypairPath;

    const { framework } = await PgFs.getWorkspaceData();
    switch (framework) {
      case Framework.NATIVE: {
        // Check Solana keypair path from Solana CLI
        if (PgTerminal.cmdExists("solana --version")) {
          const result = PgTerminal.exec("solana config get keypair");
          keypairPath = result.stdout.substring(10).trim();
        } else {
          keypairPath = this.DEFAULT_KEYPAIR_PATH;
        }

        break;
      }

      case Framework.ANCHOR:
      case Framework.SEAHORSE: {
        // Check Anchor.toml
        const anchorTomlStr = (
          await PgFs.getFiles(new RegExp(`${PATHS.FILES.ANCHOR_TOML}`))
        )[0][1];
        const anchorToml = TOML.parse(anchorTomlStr) as {
          provider: { wallet: string };
        };
        keypairPath = anchorToml?.provider?.wallet;

        break;
      }
    }

    if (!keypairPath) {
      return null;
    }

    let keypairStr;
    try {
      keypairStr = await PgFs.readFile(vscode.Uri.parse(keypairPath));
    } catch {
      return await this._createKeypair(keypairPath);
    }

    return Uint8Array.from(JSON.parse(keypairStr));
  }

  private static async _createKeypair(
    path: string = this.DEFAULT_KEYPAIR_PATH
  ) {
    // Confirm the file doesn't exist just in case
    const keypairUri = vscode.Uri.parse(path);
    const keypairExists = await PgFs.exists(keypairUri);
    if (keypairExists) {
      const keypairStr = await PgFs.readFile(keypairUri);
      return Uint8Array.from(JSON.parse(keypairStr));
    }

    const keypairBytes = Array.from(Keypair.generate().secretKey);
    await PgFs.writeFile(keypairUri, JSON.stringify(keypairBytes));
    return Uint8Array.from(keypairBytes);
  }
}
