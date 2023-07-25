import TutorialsSkeleton from "./Component/TutorialsSkeleton";
import { createSidebarPage } from "../create";

export const tutorials = createSidebarPage({
  name: "Tutorials",
  icon: "tutorials.webp",
  keybind: "Ctrl+Shift+X",
  LoadingElement: TutorialsSkeleton,
});
