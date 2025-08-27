import { createSetting } from "../create";

export const build = [
  createSetting({
    id: "build.improveErrors",
    description: "Make build errors shorter and more useful (experimental)",
  }),
];
