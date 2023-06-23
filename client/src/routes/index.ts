import { defaultRoute } from "./default";
import { tutorials } from "./tutorials";
import { tutorial } from "./tutorial";
import { github } from "./github";
import { share } from "./share";
import { notFound } from "./not-found";

/** All availabe routes, order matters */
export const ROUTES = [
  defaultRoute,
  tutorials,
  tutorial,
  github,
  share,
  notFound,
];
