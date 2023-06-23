import "styled-components";
import { ROUTES } from "../routes";
import { ThemeReady } from "../utils/pg";

global {
  function structuredClone<T>(obj: T): T;

  /** All route pathnames */
  type RoutePath = typeof ROUTES[number]["path"];
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeReady {}
}
