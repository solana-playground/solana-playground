import * as vscode from "vscode";

import { pgChannel, PgWallet } from "../../utils";

export const processAddress = async () => {
  const walletPk = await PgWallet.getPublicKey();
  const msg = `Your address is: ${walletPk.toBase58()}`;
  vscode.window.showInformationMessage(msg);
  pgChannel.appendLine(msg);
};
