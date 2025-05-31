import * as S from "./generated";

/** All configurable settings (in order) */
export const SETTINGS = Object.values(S).sort((a, b) => {
  // Prioritize select components over checkboxes
  if (a.values && !b.values) return -1;

  // Alphabetically order based on UI name
  return a.name.localeCompare(b.name);
});
