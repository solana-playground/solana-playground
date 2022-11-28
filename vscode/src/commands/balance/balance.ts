import * as vscode from "vscode";

import { pgChannel, PgCommon, PgConnection, PgWallet } from "../../utils";

export const processBalance = async () => {
  const connection = PgConnection.get();
  const walletPk = await PgWallet.getPublicKey();
  const lamports = await connection.getBalance(walletPk);
  const msg = `Your balance is: ${PgCommon.lamportsToSol(lamports).toFixed(
    2
  )} SOL`;
  vscode.window.showInformationMessage(msg);
  pgChannel.appendLine(msg);
};
