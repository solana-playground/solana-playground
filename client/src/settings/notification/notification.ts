import { createSetting } from "../create";

export const notification = [
  createSetting({
    id: "notification.showTx",
    name: "Transaction toasts",
    description: "Whether to show explorer links after a transaction is sent",
  }),
];
