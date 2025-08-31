import { IS_NODE } from "./node-compatiblity"; // Needs to happen first
import * as S from "./generated";

/** All configurable settings */
export const SETTINGS = Object.values(S).flat();

// Needed to define `DEFAULT_SETTINGS`
if (IS_NODE) {
  console.log("---DEFAULT_SETTINGS---");
  console.log(JSON.stringify(SETTINGS));
  console.log("---DEFAULT_SETTINGS---");
}
