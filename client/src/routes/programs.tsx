import { PgCommon, PgExplorer, PgRouter, PgView } from "../utils/pg";

export const programs = PgRouter.create({
  path: "/programs",
  handle: () => {
    // Set sidebar
    PgView.setSidebarPage("Programs");

    // Set main view
    PgView.setMainPrimary(async () => {
      // Initialize explorer
      await PgExplorer.init();

      // Fetch programs
      const programs = await PgCommon.fetchJSON("/programs/programs.json");
      const { Programs } = await import("../views/main/primary/Programs");
      return <Programs programs={programs} />;
    });

    // TODO: Handle this in a better way
    // Handle sidebar
    const sidebarPage = PgView.onDidChangeSidebarPage((state) => {
      switch (state) {
        case "Explorer":
        case "Build & Deploy":
        case "Test":
          PgRouter.navigate();
      }
    });

    // Minimize secondary main view and reopen on navigation to other routes
    let mainSecondaryHeight = 0;
    PgView.setMainSecondaryHeight((h) => {
      mainSecondaryHeight = h;
      return 0;
    });

    return {
      dispose: () => {
        sidebarPage.dispose();

        // This fixes the case where going back from `/programs` to `/` with
        // browser's navigations would cause incorrect component to still be mounted
        // instead of switching to `Explorer`
        PgView.setSidebarPage((state) => {
          if (state === "Programs") return "Explorer";
          return state;
        });

        // Set the main secondary view height to the previous saved value
        PgView.setMainSecondaryHeight(mainSecondaryHeight);
      },
    };
  },
});
