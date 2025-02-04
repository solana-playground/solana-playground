import * as s from "./settings";

export type { Setting } from "./create";

/** All configurable settings (in order) */
export const SETTINGS = [
  s.theme,
  s.font,
  s.endpoint,
  s.commitment,
  s.priorityFee,
  s.blockExplorer,
  s.preflightChecks,
  s.automaticAirdrop,
  s.showTransactionDetails,
  s.showTransactionNotifications,
  s.improveBuildErrors,
];
