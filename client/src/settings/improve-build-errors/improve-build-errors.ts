import { createSetting } from "../create";

export const improveBuildErrors = createSetting({
  name: "Improve build errors",
  tooltip: {
    element: "Make build errors shorter and more useful(experimental)",
    maxWidth: "15rem",
  },
  isCheckBox: true,
});
