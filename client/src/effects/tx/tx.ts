import {
  PgBytes,
  PgConnection,
  PgSettings,
  PgTx,
  PgView,
  PgWeb3,
} from "../../utils";
import { ExplorerLink } from "./ExplorerLink";

// Show a notification toast with explorer links after a transaction is sent.
export const tx = () => {
  return PgTx.onDidSend((tx) => {
    // Check setting
    if (!PgSettings.notification.showTx) return;

    // Don't show on playnet
    if (PgConnection.cluster === "playnet") return;

    // Don't show buffer initialize and write transactions (too many)
    const hasBufferInitOrWriteIx = tx.instructions.some(
      (ix) =>
        ix.programId.equals(PgWeb3.BpfLoaderUpgradeableProgram.programId) &&
        (PgWeb3.BpfLoaderUpgradeableProgram.isInitializeBufferInstruction(
          ix.data
        ) ||
          PgWeb3.BpfLoaderUpgradeableProgram.isWriteInstruction(ix.data))
    );
    if (hasBufferInitOrWriteIx) return;

    // Sanity check for signature
    if (!tx.signature) return;
    const txHash = PgBytes.toBase58(tx.signature);

    PgView.setToast(ExplorerLink, {
      componentProps: { txHash },
      options: { toastId: txHash },
    });
  });
};
