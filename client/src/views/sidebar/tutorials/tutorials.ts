import TutorialsSkeleton from "./Component/TutorialsSkeleton";
import { createSidebarPage } from "../create";
import { PgRouter } from "../../../utils/pg";

export const tutorials = createSidebarPage({
  name: "Tutorials",
  icon: "tutorials.webp",
  keybind: "Ctrl+Shift+X",
  handle: () => {
    if (!window.location.pathname.startsWith("/tutorials")) {
      PgRouter.navigate("/tutorials");
    }
  },
  LoadingElement: TutorialsSkeleton,
});
