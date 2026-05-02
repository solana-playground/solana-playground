import Default from "./Default";
import Copy from "./Copy";
import Export from "./Export";
import Import from "./Import";

const Button = Default as typeof Default & {
  Copy: typeof Copy;
  Export: typeof Export;
  Import: typeof Import;
};
Button.Copy = Copy;
Button.Export = Export;
Button.Import = Import;

export default Button;
