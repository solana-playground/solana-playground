import * as customTutorials from "./generated";
import { markdownTutorials } from "./create";

/** All visible tutorials at `/tutorials` */
export const TUTORIALS =
  Object.values(customTutorials).concat(markdownTutorials);
