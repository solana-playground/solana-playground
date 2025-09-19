import { PgPlaynet, PgSettings, PgTx, PgView } from "../../utils/pg";
import { ExplorerLink } from "./ExplorerLink";

// Show a notification toast with explorer links after a transaction is sent.
export const tx = () => {
  return PgTx.onDidSend((txHash) => {
    // Check setting
    if (!PgSettings.notification.showTx) return;

    // Don't show on playnet
    if (PgPlaynet.isUrlPlaynet()) return;

    PgView.setToast(ExplorerLink, {
      componentProps: { txHash },
      options: { toastId: txHash },
    });
  });
};
