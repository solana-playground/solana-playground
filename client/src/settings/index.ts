import * as s from "./settings";

/** All configurable settings (in order) */
export const SETTINGS = Object.values(s).sort((a, b) => {
  // Prioritize select components over checkboxes
  if (a.values && !b.values) return -1;

  // Alphabetically order based on UI name
  return a.name.localeCompare(b.name);
});
