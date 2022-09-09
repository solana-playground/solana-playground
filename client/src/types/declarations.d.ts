import "styled-components";
import Theme from "../theme/interface";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
