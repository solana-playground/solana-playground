import PreflightSetting from "./PreflightSetting";
import { createSetting } from "../create";

export const preflightChecks = createSetting({
  name: "Preflight checks",
  Component: PreflightSetting,
  tooltip: {
    text: "If enabled, this check will simulate transactions before sending them and only the transactions that pass the simulation will be sent",
    maxWidth: "18rem",
  },
  isCheckBox: true,
});
