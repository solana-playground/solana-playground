import "styled-components";
import { PgTheme } from "../theme/interface";

declare module "styled-components" {
  export interface DefaultTheme extends PgTheme {}
}
