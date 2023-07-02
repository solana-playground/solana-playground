import TutorialsSkeleton from "./Tutorials/TutorialsSkeleton";
import { PgView } from "../../../utils/pg";

export const tutorials = PgView.createSidebarPage({
  name: "Tutorials",
  icon: "tutorials.webp",
  importElement: () => import("./Tutorials"),
  LoadingElement: TutorialsSkeleton,
  keybind: "Ctrl+Shift+T",
});
