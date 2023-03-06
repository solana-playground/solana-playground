import "styled-components";
import { PgTheme } from "../utils/pg/theme";

declare module "styled-components" {
  export interface DefaultTheme extends PgTheme {}
}
