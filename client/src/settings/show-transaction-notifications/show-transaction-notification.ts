import { createSetting } from "../create";

export const showTransactionNotifications = createSetting({
  id: "notification.showTx",
  name: "Show transaction notifications",
  description: "Whether to show explorer links after a transaction is sent",
});
