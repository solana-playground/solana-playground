import { commitment } from "./commitment";
import { endpoint } from "./endpoint";
import { font } from "./font";
import { preflightChecks } from "./preflight-checks";
import { showTransactionDetails } from "./show-transaction-details";
import { theme } from "./theme";

/** UI Setting */
export interface Setting {
  /** Name of the setting */
  name: string;
  /** Setting element */
  Element: () => JSX.Element;
  /** Help tooltip */
  tooltip?: {
    /** Tooltip text */
    text: string;
    /** Max allowed with for the tooltip text */
    maxWidth: string;
  };
  /** Whether the `Element` is a `CheckBox` */
  isCheckBox?: boolean;
}

/** All configurable settings */
export const SETTINGS = [
  theme,
  font,
  endpoint,
  commitment,
  preflightChecks,
  showTransactionDetails,
];
