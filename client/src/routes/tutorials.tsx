import { Tutorials } from "../components/Tutorials";
import { PgExplorer, PgRouter, PgView, Sidebar } from "../utils/pg";

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
      if (state !== Sidebar.TUTORIALS) PgRouter.navigate();
    });
  },
});
