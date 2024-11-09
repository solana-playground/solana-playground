import { PgExplorer, PgRouter, PgView } from "../utils/pg";

export const tutorials = PgRouter.create({
  path: "/tutorials",
  handle: () => {
    // Set sidebar
    PgView.setSidebarPage("Tutorials");

    // Set main view
    PgView.setMainPrimary(async () => {
      // Initialize explorer
      await PgExplorer.init();

      const { Tutorials } = await import("../views/main/primary/Tutorials");
      return Tutorials;
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

        // TODO: Handle this automatically
        // Only change sidebar page when going outside of `/tutorials`
        if (!PgRouter.location.pathname.startsWith(tutorials.path)) {
          // This fixes the case where going back from `/tutorials` to `/` with
          // browser's navigations would cause incorrect component to still be mounted
          // instead of switching to `Explorer`
          PgView.setSidebarPage((state) => {
            if (state === "Tutorials") return "Explorer";
            return state;
          });
        }

        // Set the main secondary view height to the previous saved value
        PgView.setMainSecondaryHeight(mainSecondaryHeight);
      },
    };
  },
});
