import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const anchor = createFramework({
  name: "Anchor",
  language: Lang.RUST,
  icon: "https://www.anchor-lang.com/_next/image?url=%2Flogo.png&w=128&q=80",
  getIsCurrent: (files) => {
    for (const path in files) {
      if (!path.endsWith("lib.rs")) continue;
      const hasProgramMacro = files[path].content?.includes("#[program]");
      if (hasProgramMacro) return true;
    }

    return false;
  },
});
