import Tutorials from "../pages/ide/Panels/Main/MainView/Tutorials";
import { PgExplorer, PgRouter, PgTutorial, PgView, Sidebar } from "../utils/pg";

export const tutorials = PgRouter.create({
  path: "/tutorials",
  handle: () => {
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Set sidebar
      PgView.setSidebarState(Sidebar.TUTORIALS);

      return Tutorials;
    });

    // Handle sidebar
    return PgView.onDidChangeSidebarState((state) => {
      if (state === Sidebar.TUTORIALS) {
        if (PgTutorial.isCurrentWorkspaceTutorial()) {
          // PgTutorial.pageNumber = 0;
        }
      } else {
        PgRouter.navigate();
      }
    });
  },
});
