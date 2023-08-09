import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const native = createFramework({
  name: "Native",
  language: Lang.RUST,
  src: "/icons/platforms/solana.png",
});
