import "styled-components";
import { ThemeReady } from "../utils/pg/theme";

global {
  function structuredClone<T>(obj: T): T;
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeReady {}
}
