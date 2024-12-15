import { defaultRoute } from "./default";
import { github, githubDefault } from "./github";
import { notFound } from "./not-found";
import { programs } from "./programs";
import { share } from "./share";
import { tutorial } from "./tutorial";
import { tutorials } from "./tutorials";

/** All available routes, order matters */
export const ROUTES = [
  defaultRoute,
  tutorials,
  tutorial,
  programs,
  share,
  githubDefault,
  github,
  notFound,
];
