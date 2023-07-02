import "styled-components";
import { ROUTES } from "../routes";
import { SIDEBAR } from "../views";
import { ThemeReady } from "../utils/pg";

global {
  function structuredClone<T>(obj: T): T;

  /** All route path names */
  type RoutePath = typeof ROUTES[number]["path"];

  /** All sidebar page names */
  type SidebarPageName = typeof SIDEBAR[number]["name"];
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeReady {}
}
