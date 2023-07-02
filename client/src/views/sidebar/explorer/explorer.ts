import { PgView } from "../../../utils/pg";

export const explorer = PgView.createSidebarPage({
  name: "Explorer",
  icon: "explorer.png",
  importElement: () => import("./Explorer"),
  keybind: "Ctrl+Shift+E",
});
