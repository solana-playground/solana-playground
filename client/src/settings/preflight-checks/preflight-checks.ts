import { createSetting } from "../create";

export const preflightChecks = createSetting({
  id: "connection.preflightChecks",
  name: "Preflight checks",
  description:
    "If enabled, this check will simulate transactions before sending them and only the transactions that pass the simulation will be sent",
});
