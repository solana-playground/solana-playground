import * as vscode from "vscode";
import { execSync } from "child_process";

import { PackageMananger, PgCommon } from "./common";

export class PgTerminal {
  static async getTerminal() {
    // Check for active terminal
    const activeTerminal = vscode.window.activeTerminal;
    if (activeTerminal) {
      return activeTerminal;
    }

    // No active terminal, check for all terminals
    const allTerminals = vscode.window.terminals;
    if (allTerminals.length) {
      // Return the last one
      return allTerminals[allTerminals.length - 1];
    }

    // No terminals exist, create a terminal
    return vscode.window.createTerminal("solana");
  }

  static async runCmd(cmd: string, opts?: { show?: boolean }) {
    const terminal = await this.getTerminal();
    if (opts?.show) {
      terminal.show(true);
    }
    await terminal.sendText(cmd);
  }

  static cmdExists(cmd: string) {
    try {
      execSync(cmd);
      return true;
    } catch {
      return false;
    }
  }

  static exec(cmd: string) {
    const result = execSync(cmd);
    return { stdout: PgCommon.decodeBytes(result) };
  }

  static getPackageManager() {
    const yarnExists = this.cmdExists("yarn -v");
    if (yarnExists) {
      return PackageMananger.YARN;
    }

    const npmExists = this.cmdExists("npm -v");
    if (npmExists) {
      return PackageMananger.NPM;
    }

    vscode.window.showErrorMessage(
      "Package manager not found. Please install npm or yarn."
    );
  }
}
