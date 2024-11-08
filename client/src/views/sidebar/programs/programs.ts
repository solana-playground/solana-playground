import { PgRouter } from "../../../utils/pg";
import { createSidebarPage } from "../create";

export const programs = createSidebarPage({
  name: "Programs",
  icon: "program.png",
  keybind: "Ctrl+Shift+P",
  handle: () => {
    if (!window.location.pathname.startsWith("/programs")) {
      PgRouter.navigate("/programs");
    }
  },
});
