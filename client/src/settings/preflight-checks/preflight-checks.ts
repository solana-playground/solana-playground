import PreflightSetting from "./PreflightSetting";
import type { Setting } from "../";

export const preflightChecks: Setting = {
  name: "Preflight checks",
  Element: PreflightSetting,
  tooltip: {
    text: "If enabled, this check will simulate transactions before sending them and only the transactions that pass the simulation will be sent",
    maxWidth: "18rem",
  },
  isCheckBox: true,
};
