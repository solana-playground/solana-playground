import "styled-components";
import { PgThemeReady } from "../utils/pg/theme";

declare module "styled-components" {
  export interface DefaultTheme extends PgThemeReady {}
}
