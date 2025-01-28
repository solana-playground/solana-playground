import * as _ROUTES from "./routes";

const { defaultRoute, notFound, ...routes } = _ROUTES;
export const ROUTES = [defaultRoute, ...Object.values(routes), notFound];
