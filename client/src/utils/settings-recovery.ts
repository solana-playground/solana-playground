import type { Settings } from "./settings";

// A stale relative endpoint persisted by a prior BFF build would hit the page origin instead of the server.
export const recoverStaleSameOriginEndpoint = (
  state: Settings,
  defaults: Settings,
  isSameOriginBuild: boolean = process.env.REACT_APP_SAME_ORIGIN === "1"
): Settings => {
  const server = state.server;
  const isRelative = server?.endpoint === "" || server?.endpoint === ".";
  if (!isSameOriginBuild && isRelative) {
    server.endpoint = defaults.server.endpoint;
  }
  return state;
};
