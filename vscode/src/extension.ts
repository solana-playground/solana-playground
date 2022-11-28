import * as vscode from "vscode";

import { processCmd, Command } from "./commands";
import { PgStorage } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  // Get access to global state
  PgStorage.state = context.globalState;

  context.subscriptions.push(
    vscode.commands.registerCommand("solpg.address", () =>
      processCmd(Command.Address)
    ),
    vscode.commands.registerCommand("solpg.airdrop", () =>
      processCmd(Command.Airdrop)
    ),
    vscode.commands.registerCommand("solpg.balance", () =>
      processCmd(Command.Balance)
    ),
    vscode.commands.registerCommand("solpg.build", () =>
      processCmd(Command.Build)
    ),
    vscode.commands.registerCommand("solpg.connection", () =>
      processCmd(Command.Connection)
    ),
    vscode.commands.registerCommand("solpg.createAnchor", () =>
      processCmd(Command.CreateAnchor)
    ),
    vscode.commands.registerCommand("solpg.createNative", () =>
      processCmd(Command.CreateNative)
    ),
    vscode.commands.registerCommand("solpg.createSeahorse", () =>
      processCmd(Command.CreateSeahorse)
    ),
    vscode.commands.registerCommand("solpg.deploy", () =>
      processCmd(Command.Deploy)
    ),
    vscode.commands.registerCommand("solpg.share", () =>
      processCmd(Command.Share)
    )
  );
}

export function deactivate() {}
