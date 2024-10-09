import { PgExplorer, PgRouter, PgTutorial, PgView } from "../utils/pg";

export const defaultRoute = PgRouter.create({
  path: "/",
  handle: () => {
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Don't change the UI to avoid flickering if the current workspace is
      // a tutorial but the user is on route `/`
      if (PgTutorial.isCurrentWorkspaceTutorial()) {
        // Open the tutorial
        PgTutorial.open(PgExplorer.currentWorkspaceName!);

        // Stop the render of this method by throwing an error
        throw new Error("No need to render");
      }

      const { EditorWithTabs } = await import(
        "../views/main/primary/EditorWithTabs"
      );
      return EditorWithTabs;
    });
  },
});
