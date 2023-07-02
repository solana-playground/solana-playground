import { PgView } from "../../../utils/pg";

export const buildDeploy = PgView.createSidebarPage({
  name: "Build & Deploy",
  icon: "build.png",
  importElement: () => import("./BuildDeploy"),
  keybind: "Ctrl+Shift+B",
});
