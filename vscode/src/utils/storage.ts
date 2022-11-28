import * as vscode from "vscode";

export class PgStorage {
  static state: vscode.ExtensionContext["globalState"];

  static getItem(key: string): string | undefined {
    return this.state.get(key);
  }

  static setItem(key: string, value: string) {
    this.state.update(key, value);
  }
}
