import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const native = createFramework({
  name: "Native",
  language: Lang.RUST,
  icon: "/icons/platforms/solana.png",
  getIsCurrent: (files) => {
    for (const path in files) {
      const hasEntryPointMacro = files[path].content?.includes("entrypoint!");
      if (hasEntryPointMacro) return true;
    }

    return false;
  },
});
