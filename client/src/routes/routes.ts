import * as R from "./generated";

const { defaultRoute, notFound, ...routes } = R;
export const ROUTES = [defaultRoute, ...Object.values(routes), notFound];
