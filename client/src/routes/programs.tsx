import { Programs } from "../components/Programs";
import { PgCommon, PgExplorer, PgRouter, PgView } from "../utils/pg";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Set sidebar
      PgView.setSidebarPage("Programs");

      // Fetch programs
      const programs = await PgCommon.fetchJSON("/programs/programs.json");
      return <Programs programs={programs} />;
    });

    // Handle sidebar
    // TODO: Handle this in a better way
    return PgView.onDidChangeSidebarPage((state) => {
      switch (state) {
        case "Explorer":
        case "Build & Deploy":
        case "Test":
          PgRouter.navigate();
      }
    });
  },
});
