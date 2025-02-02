import * as customTutorials from "./tutorials";
import { markdownTutorials } from "./create";

/** All visible tutorials at `/tutorials` (in order) */
export const TUTORIALS =
  Object.values(customTutorials).concat(markdownTutorials);
