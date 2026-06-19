import {
  PgCodec,
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

    // If a tx includes an BPF Upgradeable Loader program ix, only allow the
    // final deploy/upgrade ixs to not spam
    const hasNonFinalBpfLoaderIx = tx.instructions.some(
      (ix) =>
        ix.programId.equals(PgWeb3.BpfLoaderUpgradeableProgram.programId) &&
        !(
          PgWeb3.BpfLoaderUpgradeableProgram.isDeployWithMaxProgramLenInstruction(
            ix.data
          ) || PgWeb3.BpfLoaderUpgradeableProgram.isUpgradeInstruction(ix.data)
        )
    );
    if (hasNonFinalBpfLoaderIx) return;

    // Sanity check for signature
    if (!tx.signature) return;

    const txHash = PgCodec.encodeBinary(tx.signature, "base58");
    PgView.setToast(ExplorerLink, {
      componentProps: { txHash },
      options: { toastId: txHash },
    });
  });
};
