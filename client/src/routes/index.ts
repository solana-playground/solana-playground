import { defaultRoute } from "./default";
import { github, githubDefault } from "./github";
import { notFound } from "./not-found";
import { share } from "./share";
import { tutorial } from "./tutorial";
import { tutorials } from "./tutorials";

/** All availabe routes, order matters */
export const ROUTES = [
  defaultRoute,
  tutorials,
  tutorial,
  share,
  githubDefault,
  github,
  notFound,
];
