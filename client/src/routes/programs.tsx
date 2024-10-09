import { PgCommon, PgExplorer, PgRouter, PgView } from "../utils/pg";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    // Set sidebar
    PgView.setSidebarPage("Programs");

    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Fetch programs
      const programs = await PgCommon.fetchJSON("/programs/programs.json");
      const { Programs } = await import("../views/main/primary/Programs");
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
