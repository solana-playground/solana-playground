import { convertFromPlaygroundToSingleProgramLayout } from "../common";

// TODO: Add all files that don't exist in playground but exists in the default
// framework template (e.g. `Quasar.toml`) by default (generalized impl, not
// specific to this file)
// TODO: Make this export like the default `quasar` template. Using the existing
// converter for convenience here (it works).
export const convertFromPlayground = convertFromPlaygroundToSingleProgramLayout;
