import * as vscode from "vscode";

import {
  pgChannel,
  PgCommon,
  PgConnection,
  PgValidator,
  PgWallet,
} from "../../utils";

export const processAirdrop = async () => {
  let amountStr = await vscode.window.showInputBox({
    placeHolder: "SOL Amount",
    validateInput: (value) => {
      if (PgValidator.isInt(value)) {
        return null;
      }

      throw new Error("Please enter an integer.");
    },
  });
  if (!amountStr) {
    amountStr = PgConnection.getAirdropAmount()?.toString();
    if (!amountStr) {
      throw new Error(
        `Can't airdrop on selected endpoint: ${PgConnection.endpoint}`
      );
    }
  }
  const amount = parseInt(amountStr);

  // Get connection
  const connection = PgConnection.get();

  // Get wallet public key
  const walletPk = await PgWallet.getPublicKey();

  // Airdrop
  const txHash = await connection.requestAirdrop(
    walletPk,
    PgCommon.solToLamports(amount)
  );

  // Confirm
  await connection.confirmTransaction(txHash);

  // Notify new balance
  const balance = await connection.getBalance(walletPk);

  const msg = `Airdropped ${amount} SOL. Your new balance is ${PgCommon.lamportsToSol(
    balance
  ).toFixed(2)} SOL`;
  vscode.window.showInformationMessage(msg);
  pgChannel.appendLine(msg);
};
