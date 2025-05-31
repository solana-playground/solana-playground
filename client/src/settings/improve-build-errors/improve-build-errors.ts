import { createSetting } from "../create";

export const improveBuildErrors = createSetting({
  id: "build.improveErrors",
  name: "Improve build errors",
  description: "Make build errors shorter and more useful (experimental)",
});
