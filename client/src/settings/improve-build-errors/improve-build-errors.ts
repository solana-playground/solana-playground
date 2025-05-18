import { PgSettings } from "../../utils/pg";
import { createSetting } from "../create";

export const improveBuildErrors = createSetting({
  name: "Improve build errors",
  tooltip: {
    element: "Make build errors shorter and more useful(experimental)",
    maxWidth: "15rem",
  },
  getValue: () => PgSettings.build.improveErrors,
  setValue: (v) => (PgSettings.build.improveErrors = v),
  onChange: PgSettings.onDidChangeBuildImproveErrors,
});
