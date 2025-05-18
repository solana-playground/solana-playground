import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const showTransactionNotifications = createSetting({
  name: "Show transaction notifications",
  tooltip: {
    element: "Whether to show explorer links after a transaction is sent",
    maxWidth: "15rem",
  },
  getValue: () => PgSettings.notification.showTx,
  setValue: (v) => (PgSettings.notification.showTx = v),
  onChange: PgSettings.onDidChangeNotificationShowTx,
});
