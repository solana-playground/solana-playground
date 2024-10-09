import { PgExplorer, PgRouter, PgView } from "../utils/pg";

export const tutorials = PgRouter.create({
  path: "/tutorials",
  handle: () => {
    // Set sidebar
    PgView.setSidebarPage("Tutorials");

    // Set main view
    PgView.setMain(async () => {
      // Initialize explorer
      await PgExplorer.init();

      const { Tutorials } = await import("../views/main/primary/Tutorials");
      return Tutorials;
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
