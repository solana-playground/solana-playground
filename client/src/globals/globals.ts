import * as G from "./generated";

// Prioritize settings initialization since others may depend on it.
//
// TODO: Do this automatically without having to reorder manually i.e. reorder
// based on dependencies of decorators (e.g. `PgBlockExplorer` depends on
// `PgSettings`, therefore `PgSettings` must be initialized earlier).
const { PgSettings, ...globals } = G;
export const GLOBALS = [PgSettings, ...Object.values(globals)];
