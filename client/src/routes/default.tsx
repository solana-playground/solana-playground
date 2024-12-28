import { PgExplorer, PgRouter, PgTutorial } from "../utils/pg";
import { handleRoute } from "./utils";

export const defaultRoute = PgRouter.create({
  path: "/",
  handle: () => {
    return handleRoute({
      getMain: async () => {
        // Don't change the UI to avoid flickering if the current workspace is
        // a tutorial but the user is on route `/`
        const workspaceName = PgExplorer.currentWorkspaceName;
        if (workspaceName && PgTutorial.isWorkspaceTutorial(workspaceName)) {
          // Open the tutorial
          PgTutorial.open(workspaceName);

          // Stop the render of this method by throwing an error
          throw new Error("No need to render");
        }

        const { EditorWithTabs } = await import(
          "../views/main/primary/EditorWithTabs"
        );
        return EditorWithTabs;
      },
    });
  },
});
