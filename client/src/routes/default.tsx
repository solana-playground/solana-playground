import EditorWithTabs from "../pages/ide/Panels/Main/MainView/EditorWithTabs";
import { PgExplorer, PgRouter, PgTutorial, PgView, Sidebar } from "../utils/pg";

export const defaultRoute = PgRouter.create({
  path: "/",
  handle: () => {
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Don't change the UI to avoid flickering if the current workspace is
      // a tutorial but the user is on route `/`
      if (!PgTutorial.isCurrentWorkspaceTutorial()) {
        // Set sidebar
        PgView.setSidebarState((state) => {
          if (state === Sidebar.TUTORIALS) return Sidebar.EXPLORER;
          return state;
        });

        return EditorWithTabs;
      } else {
        // Open the tutorial
        PgTutorial.open(PgExplorer.currentWorkspaceName!);

        // Stop the render of this method by throwing an error
        throw new Error("No need to render");
      }
    });
  },
});
