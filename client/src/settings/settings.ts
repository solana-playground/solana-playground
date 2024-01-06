import { commitment } from "./commitment";
import { endpoint } from "./endpoint";
import { font } from "./font";
import { improveBuildErrors } from "./improve-build-errors";
import { preflightChecks } from "./preflight-checks";
import { showTransactionDetails } from "./show-transaction-details";
import { showTransactionNotifications } from "./show-transaction-notifications";
import { theme } from "./theme";

/** All configurable settings */
export const SETTINGS = [
  theme,
  font,
  endpoint,
  commitment,
  preflightChecks,
  showTransactionDetails,
  showTransactionNotifications,
  improveBuildErrors,
];
