import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const anchor = createFramework({
  name: "Anchor",
  language: Lang.RUST,
  src: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
});
